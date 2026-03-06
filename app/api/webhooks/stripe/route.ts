import { stripe } from "@/app/_lib/stripe";
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Must use Node.js runtime to read raw body for signature verification
export const runtime = "nodejs";

// Inline enum to avoid Prisma client import issues during build
const SubscriptionStatus = {
  TRIALING: "TRIALING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
  INCOMPLETE: "INCOMPLETE",
} as const;
type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

/**
 * Maps a Stripe subscription status to our internal SubscriptionStatus enum.
 * Returns null for unknown statuses so we can log and skip safely.
 */
function mapStripeStatus(
  stripeStatus: Stripe.Subscription["status"]
): SubscriptionStatus | null {
  const map: Partial<Record<Stripe.Subscription["status"], SubscriptionStatus>> = {
    trialing: SubscriptionStatus.TRIALING,
    active: SubscriptionStatus.ACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    incomplete: SubscriptionStatus.INCOMPLETE,
    incomplete_expired: SubscriptionStatus.CANCELED,
    unpaid: SubscriptionStatus.PAST_DUE,
  };
  return map[stripeStatus] ?? null;
}

/**
 * Resolves the companyId from a Stripe subscription.
 * Priority: subscription metadata → customer metadata → DB lookup by customerId.
 */
async function resolveCompanyId(
  subscription: Stripe.Subscription
): Promise<string | null> {
  // 1. Subscription metadata (set during checkout session creation)
  if (subscription.metadata?.companyId) {
    return subscription.metadata.companyId;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // 2. Customer metadata (set during customer creation)
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted && customer.metadata?.companyId) {
      return customer.metadata.companyId;
    }
  } catch {
    // Customer retrieval failed, fall through to DB lookup
  }

  // 3. DB lookup by stripeCustomerId
  const company = await db.company.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  return company?.id ?? null;
}

/**
 * Syncs a Stripe subscription to our Company record.
 * This is the single function that keeps Stripe as the source of truth.
 */
async function syncSubscription(subscription: Stripe.Subscription) {
  const companyId = await resolveCompanyId(subscription);

  if (!companyId) {
    console.error(
      "[Webhook] ❌ Could not resolve companyId for subscription:",
      subscription.id
    );
    return;
  }

  const status = mapStripeStatus(subscription.status);

  if (!status) {
    console.warn(
      "[Webhook] ⚠️ Unknown Stripe status:",
      subscription.status,
      "— skipping update."
    );
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = subscription as any;
  const currentPeriodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000)
    : null;


  // Reflect status in `plan` field for display/logic
  const plan: string =
    status === SubscriptionStatus.TRIALING || status === SubscriptionStatus.ACTIVE
      ? "PRO"
      : "FREE";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    subscriptionStatus: status,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    stripeCurrentPeriodEnd: currentPeriodEnd,
    plan,
    // Clear boleto flags if the subscription is now active/trialing
    isBoletoPending: false,
    stripeInvoiceUrl: null,
  };

  await db.company.update({
    where: { id: companyId },
    data: updateData,
  });



  console.log(
    `[Webhook] ✅ Company ${companyId} synced → subscriptionStatus: ${status}`
  );
}

/**
 * Handles subscription deletion — marks company as CANCELED.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const companyId = await resolveCompanyId(subscription);

  if (!companyId) {
    console.error(
      "[Webhook] ❌ Could not resolve companyId for deleted subscription:",
      subscription.id
    );
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    subscriptionStatus: SubscriptionStatus.CANCELED,
    plan: "FREE",
    // Keep stripeSubscriptionId for audit trail — do NOT clear it
  };

  await db.company.update({
    where: { id: companyId },
    data: updateData,
  });


  console.log(`[Webhook] ✅ Company ${companyId} subscription deleted → CANCELED`);
}

export async function POST(req: Request) {
  const body = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("[Webhook] ❌ Missing stripe-signature header");
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Webhook] ❌ STRIPE_WEBHOOK_SECRET is not configured");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Webhook] ❌ Signature verification failed:", message);
    return new NextResponse(`Webhook signature invalid: ${message}`, {
      status: 400,
    });
  }

  console.log(`[Webhook] 🔔 Received event: ${event.type}`);

  try {
    switch (event.type) {
      // ── Subscription lifecycle ──────────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      // ── Invoice events ──────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subId: string | null = invoice.subscription ?? null;
        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(subscription);
        }
        break;
      }

      case "invoice.payment_failed":
      case "invoice.voided": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subId: string | null = invoice.subscription ?? null;

        // Clear boleto flags on failure/void
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const clearBoleto: any = {
            isBoletoPending: false,
            stripeInvoiceUrl: null,
          };
          await db.company.updateMany({
            where: { stripeCustomerId: customerId },
            data: clearBoleto,
          });
        }

        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(subscription); // Will set PAST_DUE or keep status
        }
        break;
      }

      case "invoice.payment_action_required": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
          const company = await db.company.findUnique({
            where: { stripeSubscriptionId: subId },
          });

          if (company) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const companyUpdate: any = {
              isBoletoPending: true,
              stripeInvoiceUrl: invoice.hosted_invoice_url,
            };
            await db.company.update({
              where: { id: company.id },
              data: companyUpdate,
            });
            console.log(`[Webhook] 🧾 Boleto generated for company ${company.id}`);
          }
        }
        break;
      }

      // ── Checkout completed (link customerId + subscriptionId) ───────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.companyId && session.customer && session.subscription) {
          await db.company.update({
            where: { id: session.metadata.companyId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            },
          });
          console.log(
            `[Webhook] ✅ Company ${session.metadata.companyId} linked to Stripe customer`
          );
        }
        break;
      }

      // ── Async payments (Pix, Boleto) ─────────────────────────────────────
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription;
          const subscription = await stripe.subscriptions.retrieve(subId as string);
          await syncSubscription(subscription);
          console.log(
            `[Webhook] ✅ Async payment confirmed for company ${session.metadata?.companyId}`
          );
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.warn(
          `[Webhook] ⚠️ Async payment failed for company ${session.metadata?.companyId}`
        );
        // The subscription will remain in INCOMPLETE status
        // Stripe will handle retries based on your settings
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          `[Webhook] ℹ️ Checkout expired for company ${session.metadata?.companyId}`
        );
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Webhook] ❌ Error processing event ${event.type}:`, message);
    // Return 500 so Stripe retries the event
    return new NextResponse("Internal webhook processing error", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}

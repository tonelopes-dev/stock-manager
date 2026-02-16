import { stripe } from "@/app/_lib/stripe";
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const getSubscriptionStatus = (status: Stripe.Subscription.Status) => {
  return status === "active" || status === "trialing" ? "PRO" : "FREE";
};

const getPlanLimits = (status: Stripe.Subscription.Status) => {
  if (status === "active" || status === "trialing") {
    return { maxProducts: 1000, maxUsers: 10 };
  }
  return { maxProducts: 20, maxUsers: 1 };
};

export async function POST(req: Request) {
  const body = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("❌ No Stripe signature found in headers");
    return new NextResponse("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log(`🔔 Webhook: ${event.type}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no webhook";
    console.error(`❌ Webhook Error: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  // 1. Map Company to Customer on Checkout Completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (!session?.metadata?.companyId) {
      console.error("❌ Company ID not found in checkout session metadata");
      return new NextResponse("Company ID not found in metadata", { status: 400 });
    }

    console.log(`🔗 Company ${session.metadata.companyId} matched with Stripe Customer`);

    await db.company.update({
      where: { id: session.metadata.companyId },
      data: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      },
    });
  }

  // 2. PRIMARY TRUTH: Subscription Lifecycle
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const plan = getSubscriptionStatus(subscription.status);
    const limits = getPlanLimits(subscription.status);

    // We find the company by stripeCustomerId or stripeSubscriptionId
    const company = await db.company.findFirst({
      where: {
        OR: [
          { stripeSubscriptionId: subscription.id },
          { stripeCustomerId: subscription.customer as string },
        ],
      },
    });

    if (company) {
      console.log(`✅ Updating company ${company.id} to plan ${plan}`);
      await db.company.update({
        where: { id: company.id },
        data: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date((subscription as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000),
          plan,
          ...limits,
        },
      });
    } else {
      console.warn(`⚠️ Company not found for subscription ${subscription.id} or customer ${subscription.customer}`);
    }
  }

  // 3. Optional: Handle failed payments to alert/log
  if (event.type === "invoice.payment_failed") {
    const session = event.data.object as Stripe.Invoice;
    console.warn(`Payment failed for customer ${session.customer}`);
    // Future: Send email to user
  }

  return new NextResponse(null, { status: 200 });
}

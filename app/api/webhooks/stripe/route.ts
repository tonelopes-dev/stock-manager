import { stripe } from "@/app/_lib/stripe";
import { db } from "@/app/_lib/prisma";
import { headers } from "next/headers";
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
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // 1. Map Company to Customer on Checkout Completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (!session?.metadata?.companyId) {
      return new NextResponse("Company ID not found in metadata", { status: 400 });
    }

    await db.company.update({
      where: { id: session.metadata.companyId },
      data: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      } as any,
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
      } as any,
    });

    if (company) {
      await db.company.update({
        where: { id: company.id },
        data: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          plan,
          ...limits,
        } as any,
      });
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

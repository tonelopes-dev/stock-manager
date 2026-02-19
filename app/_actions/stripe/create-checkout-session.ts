"use server";

import { auth } from "@/app/_lib/auth";
import { stripe } from "@/app/_lib/stripe";
import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, OWNER_ONLY } from "@/app/_lib/rbac";

export const createCheckoutSession = actionClient.action(async () => {
  const session = await auth();
  const companyId = await getCurrentCompanyId();
  await assertRole(OWNER_ONLY);


  if (!session?.user?.email) {
    throw new Error("Unauthorized: Email is required");
  }

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { 
        stripeCustomerId: true,
        name: true
    },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  let customerId = company.stripeCustomerId;

  // Create Stripe Customer if it doesn't exist
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: company.name,
      metadata: {
        companyId: companyId,
      },
    });
    
    customerId = customer.id;

    await db.company.update({
      where: { id: companyId },
      data: { stripeCustomerId: customerId },
    });
  }

  const stripeSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 30,
      metadata: {
        companyId: companyId,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans?canceled=true`,
    metadata: {
      companyId: companyId,
    },
  });

  if (!stripeSession.url) {
    throw new Error("Failed to create checkout session");
  }

  return { url: stripeSession.url };
});

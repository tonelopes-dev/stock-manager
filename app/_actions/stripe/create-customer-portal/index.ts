"use server";

import { auth } from "@/app/_lib/auth";
import { stripe } from "@/app/_lib/stripe";
import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const createCustomerPortalSession = actionClient.action(async () => {
  const session = await auth();
  const companyId = await getCurrentCompanyId();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { stripeCustomerId: true },
  }) as any;

  if (!company?.stripeCustomerId) {
    throw new Error("Stripe Customer ID not found. Subscribe to a plan first.");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans`,
  });

  if (!portalSession.url) {
    throw new Error("Failed to create billing portal session");
  }

  return { url: portalSession.url };
});

"use server";

import { auth } from "@/app/_lib/auth";
import { stripe } from "@/app/_lib/stripe";
import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const createPortalSession = actionClient.action(async () => {
  const session = await auth();
  const companyId = await getCurrentCompanyId();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { stripeCustomerId: true },
  });

  if (!company?.stripeCustomerId) {
    throw new Error("No stripe customer found for this company");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans`,
  });

  if (!portalSession.url) {
    throw new Error("Failed to create portal session");
  }

  return { url: portalSession.url };
});

"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export async function checkPlanStatus() {
  try {
    const companyId = await getCurrentCompanyId();
    
    if (!companyId) {
      return { subscriptionStatus: null };
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { 
        subscriptionStatus: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    return {
      subscriptionStatus: company?.subscriptionStatus,
      stripeSubscriptionId: company?.stripeSubscriptionId,
      stripeCurrentPeriodEnd: company?.stripeCurrentPeriodEnd,
    };
  } catch (error) {
    console.error("Failed to check plan status:", error);
    return { subscriptionStatus: null };
  }
}


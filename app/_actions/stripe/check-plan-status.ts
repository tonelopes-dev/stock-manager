"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export async function checkPlanStatus() {
  try {
    const companyId = await getCurrentCompanyId();
    
    if (!companyId) {
      return { plan: "FREE" as const };
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { 
        plan: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
      } as any,
    });

    return {
      plan: (company as any)?.plan ?? "FREE",
      stripeSubscriptionId: (company as any)?.stripeSubscriptionId,
      stripeCurrentPeriodEnd: (company as any)?.stripeCurrentPeriodEnd,
    };
  } catch (error) {
    console.error("Failed to check plan status:", error);
    return { plan: "FREE" as const };
  }
}

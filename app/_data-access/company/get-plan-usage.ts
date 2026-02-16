import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface PlanUsageDto {
  productCount: number;
  maxProducts: number;
  percentage: number;
  stripeCustomerId: string | null;
  plan: string;
  stripeSubscriptionId?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
}

export const getPlanUsage = async (): Promise<PlanUsageDto> => {
  const companyId = await getCurrentCompanyId();

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { 
        maxProducts: true,
        stripeCustomerId: true,
        plan: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true
    },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  const productCount = await db.product.count({
    where: { 
      companyId,
      isActive: true,
    },
  });

  return {
    productCount,
    maxProducts: company.maxProducts,
    percentage: Math.min(Math.round((productCount / company.maxProducts) * 100), 100),
    stripeCustomerId: company.stripeCustomerId,
    plan: company.plan ?? "FREE",
    stripeSubscriptionId: company.stripeSubscriptionId,
    stripeCurrentPeriodEnd: company.stripeCurrentPeriodEnd,
  };
};

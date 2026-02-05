import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface PlanUsageDto {
  productCount: number;
  maxProducts: number;
  percentage: number;
}

export const getPlanUsage = async (): Promise<PlanUsageDto> => {
  const companyId = await getCurrentCompanyId();

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { maxProducts: true },
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
  };
};

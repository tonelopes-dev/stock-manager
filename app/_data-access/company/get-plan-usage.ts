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
    select: { maxProducts: true } as any,
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

  return JSON.parse(JSON.stringify({
    productCount,
    maxProducts: (company as any).maxProducts,
    percentage: Math.min(Math.round((productCount / (company as any).maxProducts) * 100), 100),
  }));
};

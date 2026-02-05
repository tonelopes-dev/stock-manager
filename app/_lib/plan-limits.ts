import { db } from "./prisma";
import { BusinessError } from "./errors";

export async function checkProductLimit(companyId: string) {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { maxProducts: true } as any,
  });

  if (!company) throw new Error("Company not found");

  const productCount = await db.product.count({
    where: { 
      companyId,
      isActive: true,
    },
  });

  if (productCount >= (company as any).maxProducts) {
    throw new BusinessError(`Seu plano atingiu o limite de ${(company as any).maxProducts} produtos. Faça upgrade para adicionar mais.`);
  }
}

export async function verifyPlanLimit(companyId: string, limitKey: "maxProducts" | "maxUsers") {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { [limitKey]: true },
  });

  if (!company) throw new Error("Company not found");

  let currentCount = 0;
  if (limitKey === "maxProducts") {
    currentCount = await db.product.count({ where: { companyId, isActive: true } });
  } else if (limitKey === "maxUsers") {
    currentCount = await db.userCompany.count({ where: { companyId } });
  }

  const limit = (company as any)[limitKey];
  if (currentCount >= limit) {
    const featureName = limitKey === "maxProducts" ? "produtos" : "usuários";
    throw new BusinessError(`Seu plano atingiu o limite de ${limit} ${featureName}. Faça upgrade para continuar crescendo.`);
  }
}

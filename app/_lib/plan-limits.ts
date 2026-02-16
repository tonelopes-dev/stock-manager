import { db } from "./prisma";
import { BusinessError } from "./errors";

export async function checkProductLimit(companyId: string) {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { maxProducts: true },
  });

  if (!company) throw new Error("Company not found");

  const productCount = await db.product.count({
    where: { 
      companyId,
      isActive: true,
    },
  });

  if (productCount >= company.maxProducts) {
    throw new BusinessError(`Limite de produtos alcançado (${company.maxProducts}). Faça upgrade para o plano Pro e desbloqueie o crescimento do seu estoque!`);
  }
}

export async function verifyPlanLimit(companyId: string, limitKey: "maxProducts" | "maxUsers") {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      maxProducts: true,
      maxUsers: true,
    },
  });

  if (!company) throw new Error("Company not found");

  let currentCount = 0;
  if (limitKey === "maxProducts") {
    currentCount = await db.product.count({ where: { companyId, isActive: true } });
  } else if (limitKey === "maxUsers") {
    currentCount = await db.userCompany.count({ where: { companyId } });
  }

  const limit = company[limitKey];
  if (currentCount >= limit) {
    const featureName = limitKey === "maxProducts" ? "produtos" : "usuários";
    throw new BusinessError(`Você atingiu o limite de ${featureName} do seu plano. O plano Pro permite gerenciar muito mais! Vamos fazer o upgrade?`);
  }
}

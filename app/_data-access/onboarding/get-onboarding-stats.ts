import { db } from "@/app/_lib/prisma";
import { auth } from "@/app/_lib/auth";

export async function getOnboardingStats() {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const [productCount, saleCount, productsWithMinStock, company] = await Promise.all([
    db.product.count({ where: { companyId: session.user.companyId } }),
    db.sale.count({ where: { companyId: session.user.companyId } }),
    db.product.count({ 
      where: { 
        companyId: session.user.companyId,
        minStock: { gt: 0 }
      } 
    }),
    db.company.findUnique({
      where: { id: session.user.companyId },
      select: { onboardingStep: true }
    })
  ]);

  return {
    hasProducts: productCount > 0,
    hasSales: saleCount > 0,
    hasMinStock: productsWithMinStock > 0,
    onboardingStep: company?.onboardingStep ?? 0,
    productCount,
    saleCount
  };
}

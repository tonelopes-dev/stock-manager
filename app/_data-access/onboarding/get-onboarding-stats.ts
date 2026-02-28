import { db } from "@/app/_lib/prisma";
import { auth } from "@/app/_lib/auth";

export async function getOnboardingStats() {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const [productCount, saleCount] = await Promise.all([
    db.product.count({ where: { companyId: session.user.companyId } }),
    db.sale.count({ where: { companyId: session.user.companyId } }),
  ]);

  return {
    hasProducts: productCount > 0,
    hasSales: saleCount > 0,
    productCount,
    saleCount
  };
}

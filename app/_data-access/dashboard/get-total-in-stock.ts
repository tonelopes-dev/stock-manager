import "server-only";
import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const getTotalInStock = async (): Promise<number> => {
  const companyId = await getCurrentCompanyId();
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const totalStock = await db.product.aggregate({
    where: { companyId },
    _sum: {
      stock: true,
    },
  });
  return Number(totalStock._sum.stock ?? 0);
};

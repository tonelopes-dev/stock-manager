import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const getLowStockProducts = async () => {
  const companyId = await getCurrentCompanyId();

  const products = await db.product.findMany({
    where: {
      companyId,
      isActive: true,
      stock: {
        lte: db.product.fields.minStock,
      },
      // Avoid showing items that are supposed to have 0 stock and minStock 0
      NOT: {
        AND: [
            { stock: 0 },
            { minStock: 0 }
        ]
      }
    },
    orderBy: {
      stock: "asc",
    },
    take: 5,
  });

  return products;
};

import { db } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";
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
            { stock: new Prisma.Decimal(0) },
            { minStock: new Prisma.Decimal(0) }
        ]
      }
    },
    orderBy: {
      stock: "asc",
    },
    take: 5,
  });

  return products.map(product => ({
    ...product,
    stock: Number(product.stock),
    minStock: Number(product.minStock),
    price: Number(product.price),
    cost: Number(product.cost),
  }));
};

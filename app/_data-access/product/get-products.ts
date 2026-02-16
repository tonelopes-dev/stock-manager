import "server-only";

import { db } from "@/app/_lib/prisma";
import { Product } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { calculateMargin } from "@/app/_lib/pricing";
import { subDays } from "date-fns";

export type ProductStatusDto = "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK" | "SLOW_MOVING";

export interface ProductDto extends Omit<Product, "price" | "cost"> {
  price: number;
  cost: number;
  margin: number;
  status: ProductStatusDto;
}

export const getProducts = async (slowMovingDays = 30): Promise<ProductDto[]> => {
  const companyId = await getCurrentCompanyId();
  const slowMovingThreshold = subDays(new Date(), slowMovingDays);

  const products = await db.product.findMany({
    where: { companyId, isActive: true },
    include: {
      saleItems: {
        where: {
          sale: {
            status: "ACTIVE",
            date: { gte: slowMovingThreshold },
          },
        },
        take: 1,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });

  return products.map((product) => {
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock <= product.minStock;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isSlowMoving = (product as any).saleItems.length === 0 && !isOutOfStock;

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.stock,
      minStock: product.minStock,
      isActive: product.isActive,
      companyId: product.companyId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      price: Number(product.price),
      cost: Number(product.cost),
      margin: calculateMargin(product.price, product.cost),
      status: isOutOfStock
        ? "OUT_OF_STOCK"
        : isLowStock
        ? "LOW_STOCK"
        : isSlowMoving
        ? "SLOW_MOVING"
        : "IN_STOCK",
    } as ProductDto;
  });
};

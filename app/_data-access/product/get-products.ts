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
      saleProducts: {
        where: {
          sale: {
            status: "ACTIVE",
            date: { gte: slowMovingThreshold },
          },
        },
        take: 1,
      },
    },
  });

  return products.map((product) => {
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock <= product.minStock;
    const isSlowMoving = product.saleProducts.length === 0 && !isOutOfStock;

    return {
      ...product,
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
    };
  });
};

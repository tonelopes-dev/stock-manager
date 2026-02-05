import "server-only";

import { db } from "@/app/_lib/prisma";
import { Product } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { calculateMargin } from "@/app/_lib/pricing";

export type ProductStatusDto = "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK";

export interface ProductDto extends Omit<Product, "price" | "cost"> {
  price: number;
  cost: number;
  margin: number;
  status: ProductStatusDto;
}

export const getProducts = async (): Promise<ProductDto[]> => {
  const companyId = await getCurrentCompanyId();
  const products = await db.product.findMany({
    where: { companyId, isActive: true },
  });
  return products.map((product) => {
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock <= product.minStock;

    return {
      ...product,
      price: Number(product.price),
      cost: Number(product.cost),
      margin: calculateMargin(product.price, product.cost),
      status: isOutOfStock ? "OUT_OF_STOCK" : isLowStock ? "LOW_STOCK" : "IN_STOCK",
    };
  });
};

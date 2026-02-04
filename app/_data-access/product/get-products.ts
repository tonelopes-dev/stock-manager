import "server-only";

import { db } from "@/app/_lib/prisma";
import { Product } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export type ProductStatusDto = "IN_STOCK" | "OUT_OF_STOCK";

export interface ProductDto extends Omit<Product, "price"> {
  price: number;
  status: ProductStatusDto;
}

export const getProducts = async (): Promise<ProductDto[]> => {
  const companyId = await getCurrentCompanyId();
  const products = await db.product.findMany({
    where: { companyId },
  });
  return products.map((product) => ({
    ...product,
    price: Number(product.price),
    status: product.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
  }));
};

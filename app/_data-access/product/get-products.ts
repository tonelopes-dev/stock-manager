import "server-only";
import { db, Product } from "@/app/_lib/prisma";

export const getProducts = async (): Promise<Product[]> => {
  return await db.product.findMany();
};

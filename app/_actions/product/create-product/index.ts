"use server";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createProductSchema } from "./schema";

export type CreateProductSchema = z.infer<typeof createProductSchema>;

export const createProduct = async (
  data: CreateProductSchema,
): Promise<{ success: boolean; error?: unknown }> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  try {
    createProductSchema.parse(data);
    await db.product.create({ data });
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

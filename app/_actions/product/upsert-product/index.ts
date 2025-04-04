"use server";

import { z } from "zod";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertProductSchema } from "./schema";

export type UpsertProductSchema = z.infer<typeof upsertProductSchema>;

export const upsertProduct = async (data: UpsertProductSchema) => {
  upsertProductSchema.parse(data);
  await db.product.upsert({
    where: { id: data.id ?? "" },
    update: data,
    create: data,
  });

  revalidatePath("/products");
  return { success: true };
};

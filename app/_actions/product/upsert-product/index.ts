"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertProductSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { recordStockMovement } from "@/app/_lib/stock";

export const upsertProduct = actionClient
  .schema(upsertProductSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    await db.$transaction(async (trx) => {
      const { stock, ...rest } = data;
      let stockDiff = stock;

      if (id) {
        const existingProduct = await trx.product.findUnique({
          where: { id },
        });
        if (existingProduct) {
          stockDiff = stock - existingProduct.stock;
        }
      }

      const product = await trx.product.upsert({
        where: { id: id ?? "" },
        update: rest,
        create: { ...rest, companyId, stock: 0 },
      });

      if (stockDiff !== 0) {
        await recordStockMovement(
          {
            productId: product.id,
            companyId,
            userId,
            type: "MANUAL",
            quantity: stockDiff,
          },
          trx
        );
      }
    });

    revalidatePath("/products", "page");
    revalidatePath("/");
  });

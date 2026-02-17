"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertProductSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { recordStockMovement } from "@/app/_lib/stock";
import { checkProductLimit } from "@/app/_lib/plan-limits";

export const upsertProduct = actionClient
  .schema(upsertProductSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Plan Limit: Global check for new products
    if (!id) {
      await checkProductLimit(companyId);
    }

    // Business Validation: SKU Uniqueness per company
    const sku = data.sku?.trim() || null;

    if (sku) {
      const productWithSameSku = await db.product.findFirst({
        where: { 
          sku, 
          companyId,
          NOT: id ? { id } : undefined 
        },
      });

      if (productWithSameSku) {
        throw new Error("Este SKU já está em uso por outro produto da sua empresa.");
      }
    }

    await db.$transaction(async (trx) => {
      const { stock, type, ...rest } = data;
      const updateData = { ...rest, sku, type };

      if (id) {
        // Update product metadata only, ignore stock field from form
        await trx.product.update({
          where: { id, companyId },
          data: updateData,
        });
      } else {
        // Create new product with 0 stock initially
        const product = await trx.product.create({
          data: { ...updateData, companyId, stock: 0, type },
        });

        // Set initial stock via movement for auditability
        // PREPARED products: stock is managed via ingredients, skip initial movement
        if (type !== "PREPARED" && stock && stock > 0) {
          await recordStockMovement(
            {
              productId: product.id,
              companyId,
              userId,
              type: "MANUAL",
              quantity: stock,
              reason: "Estoque inicial",
            },
            trx
          );
        }
      }
    });

    revalidatePath("/products", "page");
    revalidatePath("/");
  });

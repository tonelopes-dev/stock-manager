"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertProductSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { recordStockMovement } from "@/app/_lib/stock";
import { recalculateProductCost } from "../recipe/recalculate-cost";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";

export const upsertProduct = actionClient
  .schema(upsertProductSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    const { userId } = await assertRole(ADMIN_AND_OWNER);
    await requireActiveSubscription(companyId);


    if (!userId) {
      throw new Error("User not authenticated");
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
      const { stock, type, cost, ...rest } = data;
      
      // For PREPARED products, cost is managed via recipes and shouldn't be updated here.
      // For RESELL products, cost is managed manually via this form.
      // For PREPARED products, cost is managed via recipes and shouldn't be updated here.
      // For RESELL products, cost is managed manually via this form.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { 
        ...rest, 
        sku, 
        type 
      };
      
      if (type !== "PREPARED") {
        updateData.cost = cost;
      }

      if (id) {
        // Update product metadata only, ignore stock field from form
        const updatedProduct = await trx.product.update({
          where: { id, companyId },
          data: updateData,
        });

        // If it's a PREPARED product, we must ensure its cost is correctly recalculated
        // from its recipe, especially since previous bugs might have set it to 0.
        if (updatedProduct.type === "PREPARED") {
          await recalculateProductCost(id, trx);
        }
      } else {
        // Create new product with 0 stock initially
        const product = await trx.product.create({
          data: { 
            ...updateData, 
            cost: type === "PREPARED" ? 0 : (cost || 0),
            companyId, 
            stock: 0 
          },
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

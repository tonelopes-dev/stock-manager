"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertProductSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { recordStockMovement } from "@/app/_lib/stock";
import { calculateStockDeduction } from "@/app/_lib/units";
import { recalculateProductCost } from "../recipe/recalculate-cost";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType, UnitType, Prisma } from "@prisma/client";



export const upsertProduct = actionClient
  .schema(upsertProductSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    const { userId } = await assertRole(ADMIN_AND_OWNER);
    await requireActiveSubscription(companyId);


    const sku = data.sku?.trim() || null;

    await db.$transaction(async (trx) => {
      const { stock, unit, type, cost, categoryId, expirationDate, trackExpiration, imageUrl, ...rest } = data;
      
      const updateData = { 
        ...rest, 
        sku, 
        type,
        unit,
        expirationDate,
        trackExpiration,
        imageUrl,
        cost: type === "PREPARED" ? undefined : cost
      };


      let productId = id;

      if (id) {
        // Fetch current stock before update to calculate difference
        const currentProduct = await trx.product.findUniqueOrThrow({
          where: { id, companyId },
          select: { stock: true, type: true, unit: true },
        });

        const updatedProduct = await trx.product.update({
          where: { id, companyId },
          data: {
            ...updateData,
            categoryId,
          },
        });

        // If stock changed, record stock movement
        if (stock !== undefined) {
          const stockDifference = stock - currentProduct.stock;
          if (stockDifference !== 0) {
            await recordStockMovement(
              {
                productId: id,
                companyId,
                userId,
                type: "MANUAL",
                quantity: stockDifference,
                unit: updatedProduct.unit,
                reason: "Ajuste manual via edição do produto",
              },
              trx
            );

            // For PREPARED products, reverse ingredient consumption proportionally
            if (updatedProduct.type === "PREPARED" && stockDifference < 0) {
              const recipes = await trx.productRecipe.findMany({
                where: { productId: id },
                include: { ingredient: true },
              });

              const unitsReturned = Math.abs(stockDifference);

              for (const recipe of recipes) {
                const recipeUnit = recipe.unit as UnitType;
                const ingredientUnit = recipe.ingredient.unit as UnitType;

                const recipeQtyPerUnit = new Prisma.Decimal(recipe.quantity.toString());
                const totalRecipeQty = recipeQtyPerUnit.mul(unitsReturned);

                const deductionInStockUnit = calculateStockDeduction(
                  totalRecipeQty,
                  recipeUnit,
                  ingredientUnit,
                );

                // Return ingredients to stock (positive quantity = increase)
                await recordStockMovement(
                  {
                    ingredientId: recipe.ingredientId,
                    companyId,
                    userId,
                    type: "MANUAL",
                    quantity: deductionInStockUnit,
                    unit: recipe.ingredient.unit,
                    reason: `Devolução de insumo: ajuste de estoque de ${currentProduct.stock} → ${stock} un de ${updatedProduct.name}`,
                  },
                  trx,
                );
              }
            }
          }
        }

        if (updatedProduct.type === "PREPARED") {
          await recalculateProductCost(id, trx);
        }
      } else {
        const product = await trx.product.create({
          data: { 
            ...updateData, 
            cost: type === "PREPARED" ? 0 : (cost || 0),
            companyId, 
            stock: 0,
            categoryId,
          },
        });
        productId = product.id;

        if (stock && stock > 0) {
          await recordStockMovement(
            {
              productId: product.id,
              companyId,
              userId,
              type: "MANUAL",
              quantity: stock,
              unit: product.unit,
              reason: "Estoque inicial",
            },
            trx
          );
        }
      }

      // 3. Log Audit within transaction
      await AuditService.logWithTransaction(trx, {
        type: id ? AuditEventType.PRODUCT_UPDATED : AuditEventType.PRODUCT_CREATED,
        companyId,
        entityType: "PRODUCT",
        entityId: productId,
        metadata: {
          productId,
          sku,
          name: data.name,
          unit: data.unit,
          type: data.type,
        },
      });
    });

    revalidatePath("/", "layout");
    revalidatePath("/products", "page");
    if (id) {
      revalidatePath(`/products/${id}`, "page");
    }
    revalidatePath("/ingredients", "page");
    revalidatePath("/dashboard");
  });

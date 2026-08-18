"use server";

import { db } from "@/app/_lib/prisma";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { IngredientService } from "@/app/_services/ingredient";
import { adjustIngredientStockSchema } from "./schema";


export const adjustIngredientStock = actionClient
  .schema(adjustIngredientStockSchema)
  .action(async ({ parsedInput: { id, quantity, reason } }) => {
  try {
      const companyId = await getCurrentCompanyId();
      await requireActiveSubscription(companyId);
      const { userId } = await assertActionCapability(PERMISSIONS.STOCK_ADJUST);

      if (!userId) {
        throw new Error("User not authenticated");
      }

      await db.$transaction(async (trx) => {
        const movement = await IngredientService.adjustStock(
          {
            ingredientId: id,
            companyId,
            userId,
            quantity,
            reason,
          },
          trx
        );

        const ingredient = await trx.product.findUniqueOrThrow({
          where: { id },
          select: { name: true, unit: true },
        });

        // Log Audit
        await AuditService.logWithTransaction(trx, {
          type: AuditEventType.INGREDIENT_STOCK_ADJUSTED,
          companyId,
          entityType: "PRODUCT", // Or add INGREDIENT to entityType later, but PRODUCT is used for items
          entityId: id,
          metadata: {
            ingredientId: id,
            name: ingredient.name,
            qty: quantity,
            unit: ingredient.unit,
            before: Number(movement.stockBefore),
            after: Number(movement.stockAfter),
            reason,
          },
        });
      });

      revalidatePath("/estoque");
      revalidatePath("/cardapio");
      revalidatePath("/");
    } catch (error) {
      console.error("[INGREDIENT_STOCK_ADJUST_ERROR]", error);
      throw error;
    }
  });

"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { adjustIngredientStockSchema } from "./schema";
import { actionClient } from "../../../_lib/safe-action";
import { getCurrentCompanyId } from "../../../_lib/get-current-company";
import { ADMIN_AND_OWNER, assertRole } from "../../../_lib/rbac";
import { IngredientService } from "../../../_services/ingredient";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType } from "@prisma/client";


export const adjustIngredientStock = actionClient
  .schema(adjustIngredientStockSchema)
  .action(async ({ parsedInput: { id, quantity, reason } }) => {
    console.log("[INGREDIENT_STOCK_ADJUST] Requisição recebida:", { ingredientId: id, quantity, reason });

    try {
      const companyId = await getCurrentCompanyId();
      await requireActiveSubscription(companyId);
      const { userId } = await assertRole(ADMIN_AND_OWNER);

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

"use server";

import { db } from "@/app/_lib/prisma";
import { deleteIngredientSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType, AuditSeverity } from "@prisma/client";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";


export const deleteIngredient = actionClient
  .schema(deleteIngredientSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await requireActiveSubscription(companyId);
    await assertRole(ADMIN_AND_OWNER);


    const ingredient = await db.ingredient.findFirst({
      where: { id, companyId },
    });

    if (!ingredient) {
      throw new Error("Insumo não encontrado.");
    }

    await db.$transaction(async (trx) => {
      await trx.ingredient.update({
        where: { id },
        data: { isActive: false },
      });

      // 3. Log Audit
      await AuditService.logWithTransaction(trx, {
        type: AuditEventType.INGREDIENT_DELETED,
        severity: AuditSeverity.WARNING,
        companyId,
        entityType: "PRODUCT",
        entityId: id,
        metadata: {
          ingredientId: id,
          name: ingredient.name,
          reason: "Manual deletion (Soft Delete / Deactivation)",
        },
      });
    });

    revalidatePath("/ingredients", "page");
    revalidatePath("/");
  });

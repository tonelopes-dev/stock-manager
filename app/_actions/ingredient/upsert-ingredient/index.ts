"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertIngredientSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { IngredientService } from "@/app/_services/ingredient";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { redirect } from "next/navigation";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType } from "@prisma/client";

export const upsertIngredient = actionClient
  .schema(upsertIngredientSchema)
  .action(async ({ parsedInput: { id, stock, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    await requireActiveSubscription(companyId);
    const session = await auth();

    if (!session?.user?.id) {
      redirect("/login?reason=session_expired");
    }

    const userId = session.user.id;

    await db.$transaction(async (trx) => {
      let ingredientId = id;

      if (id) {
        // Update ingredient metadata only, ignore stock field from form
        const updated = await trx.ingredient.update({
          where: { id },
          data,
        });
        ingredientId = updated.id;
      } else {
        // Create new ingredient with 0 stock initially
        const ingredient = await trx.ingredient.create({
          data: { ...data, companyId, stock: 0 },
        });
        ingredientId = ingredient.id;

        // Set initial stock via movement for auditability
        if (stock && stock > 0) {
          await IngredientService.adjustStock(
            {
              ingredientId: ingredient.id,
              companyId,
              userId,
              quantity: stock,
              reason: "Estoque inicial",
            },
            trx,
          );
        }
      }

      // 3. Log Audit
      await AuditService.logWithTransaction(trx, {
        type: id ? AuditEventType.INGREDIENT_UPDATED : AuditEventType.INGREDIENT_CREATED,
        companyId,
        entityType: "PRODUCT", // Use PRODUCT for now as it's the catch-all for items
        entityId: ingredientId,
        metadata: {
          ingredientId,
          name: data.name,
          unit: data.unit,
        },
      });
    });

    revalidatePath("/ingredients", "page");
    revalidatePath("/");
  });

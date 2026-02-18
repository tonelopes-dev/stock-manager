"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertIngredientSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { IngredientService } from "@/app/_services/ingredient";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";

export const upsertIngredient = actionClient
  .schema(upsertIngredientSchema)
  .action(async ({ parsedInput: { id, stock, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    await requireActiveSubscription(companyId);
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    await db.$transaction(async (trx) => {
      if (id) {
        // Update ingredient metadata only, ignore stock field from form
        await trx.ingredient.update({
          where: { id },
          data,
        });
      } else {
        // Create new ingredient with 0 stock initially
        const ingredient = await trx.ingredient.create({
          data: { ...data, companyId, stock: 0 },
        });

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
    });

    revalidatePath("/ingredients", "page");
    revalidatePath("/");
  });

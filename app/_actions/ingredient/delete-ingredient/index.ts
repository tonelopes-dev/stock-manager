"use server";

import { db } from "@/app/_lib/prisma";
import { deleteIngredientSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";


export const deleteIngredient = actionClient
  .schema(deleteIngredientSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ADMIN_AND_OWNER);


    const ingredient = await db.ingredient.findFirst({
      where: { id, companyId },
    });

    if (!ingredient) {
      throw new Error("Insumo não encontrado.");
    }

    await db.ingredient.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/ingredients", "page");
    revalidatePath("/");
  });

"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { updateRecipeIngredientSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const updateRecipeIngredient = actionClient
  .schema(updateRecipeIngredientSchema)
  .action(async ({ parsedInput: { id, quantity, unit } }) => {
    const companyId = await getCurrentCompanyId();

    const recipe = await db.productRecipe.findFirst({
      where: { id },
      include: { product: true },
    });

    if (!recipe || recipe.product.companyId !== companyId) {
      throw new Error("Registro de receita não encontrado.");
    }

    await db.productRecipe.update({
      where: { id },
      data: { quantity, unit },
    });

    revalidatePath(`/products/${recipe.productId}`, "page");
  });

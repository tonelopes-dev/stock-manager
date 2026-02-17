"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { deleteRecipeIngredientSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { recalculateProductCost } from "./recalculate-cost";

export const deleteRecipeIngredient = actionClient
  .schema(deleteRecipeIngredientSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();

    const recipe = await db.productRecipe.findFirst({
      where: { id },
      include: { product: true },
    });

    if (!recipe || recipe.product.companyId !== companyId) {
      throw new Error("Registro de receita não encontrado.");
    }

    await db.productRecipe.delete({
      where: { id },
    });

    await recalculateProductCost(recipe.productId);

    revalidatePath(`/products/${recipe.productId}`, "page");
    revalidatePath("/products", "page");
    revalidatePath("/");
  });

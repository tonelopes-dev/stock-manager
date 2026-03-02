"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { updateRecipeIngredientSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { isUnitCompatible } from "@/app/_lib/units";
import { UnitType } from "@prisma/client";
import { recalculateProductCost } from "./recalculate-cost";

export const updateRecipeIngredient = actionClient
  .schema(updateRecipeIngredientSchema)
  .action(async ({ parsedInput: { id, quantity, unit } }) => {
    const companyId = await getCurrentCompanyId();

    const recipe = await db.productRecipe.findFirst({
      where: { id },
      include: { product: true, ingredient: true },
    });

    if (!recipe || recipe.product.companyId !== companyId) {
      throw new Error("Registro de receita não encontrado.");
    }

    // Check unit compatibility
    if (!isUnitCompatible(unit as UnitType, recipe.ingredient.unit)) {
      throw new Error(
        `Unidade incompatível: O insumo ${recipe.ingredient.name} é estocado em ${recipe.ingredient.unit} e não pode ser convertido para ${unit}.`
      );
    }

    await db.productRecipe.update({
      where: { id },
      data: { quantity, unit },
    });

    await recalculateProductCost(recipe.productId);

    revalidatePath(`/products/${recipe.productId}`, "page");
    revalidatePath("/products", "page");
    revalidatePath("/");
  });

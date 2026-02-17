"use server";

import { db } from "@/app/_lib/prisma";
import { calculateRealCost } from "@/app/_lib/units";
import { UnitType } from "@prisma/client";

/**
 * Recalculates a PREPARED product's cost from its recipe ingredients
 * and persists the result in the product.cost field.
 */
export async function recalculateProductCost(productId: string) {
  const recipes = await db.productRecipe.findMany({
    where: { productId },
    include: { ingredient: true },
  });

  let totalCost = 0;

  for (const recipe of recipes) {
    const partialCost = Number(
      calculateRealCost(
        recipe.quantity,
        recipe.unit as UnitType,
        recipe.ingredient.unit as UnitType,
        recipe.ingredient.cost
      )
    );
    totalCost += partialCost;
  }

  await db.product.update({
    where: { id: productId },
    data: { cost: totalCost },
  });

  return totalCost;
}

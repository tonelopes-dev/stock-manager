"use server";

import { db } from "@/app/_lib/prisma";
import { calculateRealCost } from "@/app/_lib/units";
import { UnitType, Prisma } from "@prisma/client";

/**
 * Recalculates a PREPARED product's cost from its recipe ingredients
 * and persists the result in the product.cost field.
 */
export async function recalculateProductCost(
  productId: string, 
  trx?: Prisma.TransactionClient
) {
  const client = trx || db;
  
  const recipes = await client.productRecipe.findMany({
    where: { productId },
    include: { ingredient: true },
  });

  let totalCost = 0;

  for (const recipe of recipes) {
    try {
      const partialCost = Number(
        calculateRealCost(
          recipe.quantity,
          recipe.unit as UnitType,
          recipe.ingredient.unit as UnitType,
          recipe.ingredient.cost
        )
      );
      totalCost += partialCost;
    } catch (error) {
      console.error(`Error calculating cost for recipe item ${recipe.id}:`, error);
      // If units are incompatible, we treat cost as 0 for this item to avoid crashing the whole product view
      // The user will see a cost of 0 and hopefully realize something is wrong
    }
  }

  await client.product.update({
    where: { id: productId },
    data: { cost: totalCost },
  });

  return totalCost;
}

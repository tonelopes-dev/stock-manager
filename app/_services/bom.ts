import { recordStockMovement } from "@/app/_lib/stock";
import { calculateRealCost, calculateStockDeduction } from "@/app/_lib/units";
import { Prisma } from "@prisma/client";
const { Decimal } = Prisma;

export const BOMService = {
  /**
   * Explodes a product recipe and deducts ingredients from stock.
   * Returns the total real cost of the production.
   */
  async explodeAndDeduct(
    params: {
      productId: string;
      quantity: number;
      companyId: string;
      userId: string;
      saleId?: string;
    },
    trx: Prisma.TransactionClient
  ): Promise<Prisma.Decimal> {
    const { productId, quantity, companyId, userId, saleId } = params;

    // 1. Fetch recipe with ingredients
    const recipes = await trx.productRecipe.findMany({
      where: { productId },
      include: {
        ingredient: true,
      },
    });

    if (recipes.length === 0) {
      // If a PREPARED product has no recipe, we might want to log this or throw
      // For now, return 0 cost but consider this an edge case
      return new Decimal(0);
    }

    let totalCost = new Decimal(0);

    for (const recipe of recipes) {
      const ingredient = recipe.ingredient;
      
      // Calculate total quantity to deduct (Recipe Qty * Sold Qty)
      const totalRecipeQty = new Decimal(recipe.quantity.toString()).mul(quantity);

      // 2. Calculate deduction in stock unit
      const deductionQty = calculateStockDeduction(
        totalRecipeQty,
        recipe.unit,
        ingredient.unit
      );

      // 3. Calculate cost contribution
      const itemCost = calculateRealCost(
        totalRecipeQty,
        recipe.unit,
        ingredient.unit,
        ingredient.cost
      );
      totalCost = totalCost.add(itemCost);

      // 4. Record Stock Movement for Ingredient
      await recordStockMovement(
        {
          ingredientId: ingredient.id,
          companyId,
          userId,
          type: "SALE",
          quantity: deductionQty.negated(),
          saleId,
          reason: `Venda de produto preparado: ${productId}`,
        },
        trx
      );
    }

    return totalCost;
  },
};

import { UnitType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { UNIT_CONFIG, isUnitCompatible } from "./units-shared";

export { isUnitCompatible, UNIT_CONFIG };
export type { UnitFamily, UnitInfo } from "./units-shared";

/**
 * Normalizes a quantity to its base unit (G, ML, or UN)
 */
export function normalizeQuantity(quantity: number | Decimal, unit: UnitType): Decimal {
  const decimalQty = new Decimal(quantity.toString());
  const config = UNIT_CONFIG[unit];
  return decimalQty.mul(config.ratio);
}


/**
 * Calculates the required quantity in the "Stock Unit" based on the "Recipe Quantity/Unit"
 * Example: Recipe uses 150G, Stock is in KG.
 * Result: 0.15 KG
 */
export function calculateStockDeduction(
  recipeQty: number | Decimal,
  recipeUnit: UnitType,
  stockUnit: UnitType
): Decimal {
  if (!isUnitCompatible(recipeUnit, stockUnit)) {
    throw new Error(
      `Incompatible unit families: Cannot convert ${recipeUnit} to ${stockUnit}`
    );
  }

  const stockConfig = UNIT_CONFIG[stockUnit];
  const normalizedRecipeQty = normalizeQuantity(recipeQty, recipeUnit);
  return normalizedRecipeQty.div(stockConfig.ratio);
}

/**
 * Calculates the real cost based on the ingredient's cost (per stock unit)
 * and the quantity used in the recipe.
 */
export function calculateRealCost(
  recipeQty: number | Decimal,
  recipeUnit: UnitType,
  stockUnit: UnitType,
  stockUnitCost: number | Decimal
): Decimal {
  const deduction = calculateStockDeduction(recipeQty, recipeUnit, stockUnit);
  const costPerUnit = new Decimal(stockUnitCost.toString());
  return deduction.mul(costPerUnit);
}

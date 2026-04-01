import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { calculateMargin } from "@/app/_lib/pricing";
import { calculateRealCost, calculateStockDeduction } from "@/app/_lib/units";
import { UnitType } from "@prisma/client";

const UNIT_LABELS: Record<string, string> = {
  KG: "Kg",
  G: "g",
  L: "L",
  ML: "ml",
  UN: "Un",
};

export interface RecipeIngredientDto {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitLabel: string;
  ingredientCost: number;
  ingredientUnit: string;
  ingredientUnitLabel: string;
  ingredientStock: number;
  partialCost: number;
  /** How much ingredient stock is consumed per 1 unit of product produced (in stock unit) */
  consumptionPerUnit: number;
}

export interface ProductDetailDto {
  id: string;
  name: string;
  type: string;
  price: number;
  cost: number;
  margin: number;
  sku: string | null;
  stock: number;
  minStock: number;
  unit: UnitType;
  categoryId: string | null;
  environmentId: string | null;
  imageUrl: string | null;
  trackExpiration: boolean;
  expirationDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  recipes: RecipeIngredientDto[];
  recipeCost: number;
}

export const getProductById = async (id: string): Promise<ProductDetailDto | null> => {
  const companyId = await getCurrentCompanyId();

  const product = await db.product.findFirst({
    where: { id, companyId, isActive: true },
    include: {
      parentCompositions: {
        include: {
          child: true,
        },
      },
    },
  });

  if (!product) return null;

  const recipes: RecipeIngredientDto[] = product.parentCompositions.map((recipe) => {
    let partialCost = 0;
    let consumptionPerUnit = 0;

    const childCost = recipe.child.cost.toNumber();
    const recipeQuantity = recipe.quantity.toNumber();

    try {
      partialCost = Number(
        calculateRealCost(
          recipeQuantity,
          recipe.child.unit as UnitType,
          recipe.child.unit as UnitType, // Note: child is the ingredient, so the recipe unit is missing from ProductComposition now? The query needs to use child.unit. Wait, old ProductRecipe had a `unit`. ProductComposition does not have a unit. We assume quantity is in child's unit.
          childCost
        )
      );

      // Since ProductComposition doesn't have a unit, consumption per unit is just quantity
      consumptionPerUnit = recipeQuantity;
    } catch (e) {
      console.error(`Error calculating recipe values for ${recipe.id}:`, e);
      // Incompatible units, keep values at 0
    }

    return {
      id: recipe.id,
      ingredientId: recipe.childId,
      ingredientName: recipe.child.name,
      quantity: recipeQuantity,
      unit: recipe.child.unit,
      unitLabel: UNIT_LABELS[recipe.child.unit] || recipe.child.unit,
      ingredientCost: childCost,
      ingredientUnit: recipe.child.unit,
      ingredientUnitLabel: UNIT_LABELS[recipe.child.unit] || recipe.child.unit,
      ingredientStock: recipe.child.stock.toNumber(),
      partialCost: recipeQuantity * childCost, // simplification since units are the same now
      consumptionPerUnit,
    };
  });

  const recipeCost = recipes.reduce((sum, r) => sum + r.partialCost, 0);
  const productCost = product.cost.toNumber();
  const effectiveCost =
    product.type === "PRODUCAO_PROPRIA" || product.type === "COMBO"
      ? recipeCost
      : productCost;
  const price = product.price.toNumber();

  return {
    id: product.id,
    name: product.name,
    type: product.type,
    price,
    cost: effectiveCost,
    margin: calculateMargin(price, effectiveCost),
    sku: product.sku,
    stock: product.stock.toNumber(),
    minStock: product.minStock.toNumber(),
    unit: product.unit,
    categoryId: product.categoryId,
    environmentId: product.environmentId,
    imageUrl: product.imageUrl,
    trackExpiration: product.trackExpiration,
    expirationDate: product.expirationDate,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    recipes,
    recipeCost,
  };
};

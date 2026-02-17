import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { calculateMargin } from "@/app/_lib/pricing";
import { calculateRealCost } from "@/app/_lib/units";
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
      recipes: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  if (!product) return null;

  const recipes: RecipeIngredientDto[] = product.recipes.map((recipe) => {
    const partialCost = Number(
      calculateRealCost(
        recipe.quantity,
        recipe.unit as UnitType,
        recipe.ingredient.unit as UnitType,
        recipe.ingredient.cost
      )
    );

    return {
      id: recipe.id,
      ingredientId: recipe.ingredientId,
      ingredientName: recipe.ingredient.name,
      quantity: Number(recipe.quantity),
      unit: recipe.unit,
      unitLabel: UNIT_LABELS[recipe.unit] || recipe.unit,
      ingredientCost: Number(recipe.ingredient.cost),
      ingredientUnit: recipe.ingredient.unit,
      ingredientUnitLabel: UNIT_LABELS[recipe.ingredient.unit] || recipe.ingredient.unit,
      ingredientStock: Number(recipe.ingredient.stock),
      partialCost,
    };
  });

  const recipeCost = recipes.reduce((sum, r) => sum + r.partialCost, 0);
  const effectiveCost = product.type === "PREPARED" ? recipeCost : Number(product.cost);

  return {
    id: product.id,
    name: product.name,
    type: product.type,
    price: Number(product.price),
    cost: effectiveCost,
    margin: calculateMargin(product.price, effectiveCost),
    sku: product.sku,
    stock: product.stock,
    minStock: product.minStock,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    recipes,
    recipeCost,
  };
};

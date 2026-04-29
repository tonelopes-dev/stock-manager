import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { calculateMargin } from "@/app/_lib/pricing";
import { calculateRealCost, calculateStockDeduction } from "@/app/_lib/units";
import { UnitType } from "@prisma/client";
import { calculateProductAvailability } from "@/app/_data-access/product/calculate-product-availability";

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
  operationalCost: number;
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
  isMadeToOrder: boolean;
  createdAt: Date;
  updatedAt: Date;
  recipes: RecipeIngredientDto[];
  recipeCost: number;
  ingredients?: { name: string; availability: number }[];
  virtualStock: number;
  limitingIngredient?: string;
  allowNegativeStock: boolean;
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
      company: {
        select: { allowNegativeStock: true },
      },
    },
  });

  if (!product) return null;

  const virtualStock = await calculateProductAvailability(product.id);

  const recipesWithAvailability = await Promise.all(product.parentCompositions.map(async (recipe) => {
    let partialCost = 0;
    let consumptionPerUnit = 0;

    const childCost = recipe.child.cost?.toNumber() ?? 0;
    const recipeQuantity = recipe.quantity?.toNumber() ?? 0;
    
    // Use recursive calculation for the child as well
    const childAvailability = await calculateProductAvailability(recipe.childId);

    try {
      partialCost = Number(
        calculateRealCost(
          recipeQuantity,
          recipe.child.unit as UnitType,
          recipe.child.unit as UnitType, 
          childCost
        )
      );

      consumptionPerUnit = recipeQuantity;
    } catch (e) {
      console.error(`Error calculating recipe values for ${recipe.id}:`, e);
    }

    return {
      recipe: {
        id: recipe.id,
        ingredientId: recipe.childId,
        ingredientName: recipe.child.name,
        quantity: recipeQuantity,
        unit: recipe.child.unit,
        unitLabel: UNIT_LABELS[recipe.child.unit] || recipe.child.unit,
        ingredientCost: childCost,
        ingredientUnit: recipe.child.unit,
        ingredientUnitLabel: UNIT_LABELS[recipe.child.unit] || recipe.child.unit,
        ingredientStock: recipe.child.stock?.toNumber() ?? 0,
        partialCost: recipeQuantity * childCost, 
        consumptionPerUnit,
      },
      availability: recipeQuantity > 0 ? Math.floor(childAvailability / recipeQuantity) : Infinity
    };
  }));

  const recipes = recipesWithAvailability.map(r => r.recipe);
  const ingredientAvailability = recipesWithAvailability.map(r => ({
    name: r.recipe.ingredientName,
    availability: r.availability === Infinity ? 0 : r.availability
  }));

  // Find limiting ingredient based on virtual availability
  let limitingIngredient: string | undefined;
  let minAvail = Infinity;
  recipesWithAvailability.forEach(r => {
    if (r.availability < minAvail) {
      minAvail = r.availability;
      limitingIngredient = r.recipe.ingredientName;
    }
  });
  const recipeCost = recipes.reduce((sum, r) => sum + r.partialCost, 0);
  const productCost = product.cost?.toNumber() ?? 0;
  const operationalCost = product.operationalCost?.toNumber() ?? 0;
  const effectiveCost =
    product.type === "PRODUCAO_PROPRIA" || product.type === "COMBO"
      ? recipeCost
      : productCost;
  const price = product.price?.toNumber() ?? 0;
  const stock = product.stock?.toNumber() ?? 0;

    return {
      id: product.id,
      name: product.name,
      type: product.type,
      price,
      cost: effectiveCost,
      operationalCost,
      margin: calculateMargin(price, effectiveCost + operationalCost),
      sku: product.sku,
      stock,
      minStock: product.minStock?.toNumber() ?? 0,
      unit: product.unit,
      categoryId: product.categoryId,
      environmentId: product.environmentId,
      imageUrl: product.imageUrl,
      trackExpiration: product.trackExpiration,
      expirationDate: product.expirationDate,
      isActive: product.isActive,
      isMadeToOrder: product.isMadeToOrder,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      recipes,
      recipeCost,
      virtualStock,
      limitingIngredient,
      ingredients: ingredientAvailability,
      allowNegativeStock: product.company.allowNegativeStock,
    };
};

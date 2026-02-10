import "server-only";

import { db } from "@/app/_lib/prisma";
import { Ingredient } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export type IngredientStatusDto = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

const UNIT_LABELS: Record<string, string> = {
  KG: "Kg",
  G: "g",
  L: "L",
  ML: "ml",
  UN: "Un",
};

export interface IngredientDto extends Omit<Ingredient, "cost" | "stock" | "minStock"> {
  cost: number;
  stock: number;
  minStock: number;
  status: IngredientStatusDto;
  unitLabel: string;
}

export const getIngredients = async (): Promise<IngredientDto[]> => {
  const companyId = await getCurrentCompanyId();

  const ingredients = await db.ingredient.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
  });

  return JSON.parse(
    JSON.stringify(
      ingredients.map((ingredient) => {
        const stock = Number(ingredient.stock);
        const minStock = Number(ingredient.minStock);

        const isOutOfStock = stock <= 0;
        const isLowStock = stock > 0 && stock <= minStock;

        return {
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          unitLabel: UNIT_LABELS[ingredient.unit] || ingredient.unit,
          cost: Number(ingredient.cost),
          stock,
          minStock,
          isActive: ingredient.isActive,
          companyId: ingredient.companyId,
          createdAt: ingredient.createdAt,
          updatedAt: ingredient.updatedAt,
          status: isOutOfStock
            ? "OUT_OF_STOCK"
            : isLowStock
            ? "LOW_STOCK"
            : "IN_STOCK",
        } as IngredientDto;
      }),
    ),
  );
};

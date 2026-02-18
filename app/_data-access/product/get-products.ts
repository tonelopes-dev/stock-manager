import "server-only";

import { db } from "@/app/_lib/prisma";
import { Product, UnitType } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { calculateMargin } from "@/app/_lib/pricing";
import { subDays } from "date-fns";
import { calculateRealCost } from "@/app/_lib/units";

export type ProductStatusDto = "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK" | "SLOW_MOVING";

export interface ProductDto extends Omit<Product, "price" | "cost"> {
  price: number;
  cost: number;
  margin: number;
  status: ProductStatusDto;
}

export const getProducts = async (slowMovingDays = 30): Promise<ProductDto[]> => {
  const companyId = await getCurrentCompanyId();
  const slowMovingThreshold = subDays(new Date(), slowMovingDays);

  const products = await db.product.findMany({
    where: { companyId, isActive: true },
    include: {
      saleItems: {
        where: {
          sale: {
            status: "ACTIVE",
            date: { gte: slowMovingThreshold },
          },
        },
        take: 1,
      },
      recipes: {
        include: {
          ingredient: true,
        },
      },
    }
  });

  return products.map((product) => {
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock <= product.minStock;
    const isSlowMoving = product.saleItems.length === 0 && !isOutOfStock;

    // Calculate effective cost: use recipe cost for PREPARED products
    let effectiveCost = Number(product.cost);
    
    if (product.type === "PREPARED") {
      const recipeCost = product.recipes.reduce((sum, recipe) => {
        const partialCost = calculateRealCost(
          recipe.quantity,
          recipe.unit as UnitType,
          recipe.ingredient.unit as UnitType,
          recipe.ingredient.cost
        );
        return sum + Number(partialCost);
      }, 0);
      
      // If the product has a recipe, use it. 
      // This "fixes" the bug where cost was reset to 0 in the DB.
      if (product.recipes.length > 0) {
        effectiveCost = recipeCost;
      }
    }

    return {
      id: product.id,
      name: product.name,
      type: product.type,
      sku: product.sku,
      stock: product.stock,
      minStock: product.minStock,
      isActive: product.isActive,
      companyId: product.companyId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      price: Number(product.price),
      cost: effectiveCost,
      margin: calculateMargin(product.price, effectiveCost),
      status: isOutOfStock
        ? "OUT_OF_STOCK"
        : isLowStock
        ? "LOW_STOCK"
        : isSlowMoving
        ? "SLOW_MOVING"
        : "IN_STOCK",
    } as ProductDto;
  });
};

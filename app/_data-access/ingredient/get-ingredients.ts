import "server-only";

import { db } from "@/app/_lib/prisma";
import { Product, ProductType, UnitType } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export type IngredientStatusDto = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

const UNIT_LABELS: Record<string, string> = {
  KG: "Kg",
  G: "g",
  L: "L",
  ML: "ml",
  UN: "Un",
  PCT: "pct",
  MC: "mç",
};

export interface IngredientDto {
  id: string;
  name: string;
  type: ProductType;
  unit: UnitType;
  unitLabel: string;
  cost: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  expirationDate: Date | null;
  trackExpiration: boolean;
  expirationReminderDate: Date | null;
  status: IngredientStatusDto;
}

export interface GetIngredientsParams {
  search?: string;
  supplierId?: string;
  status?: "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRING" | "OK";
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface GetIngredientsResponse {
  data: IngredientDto[];
  total: number;
}

export const getIngredients = async (
  params: GetIngredientsParams = {}
): Promise<GetIngredientsResponse> => {
  const companyId = await getCurrentCompanyId();
  const { search, supplierId, status, includeInactive, page = 1, pageSize = 10 } = params;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: any = {
    companyId,
    type: { in: ["INSUMO", "REVENDA"] },
    isActive: includeInactive ? undefined : true,
  };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (supplierId) {
    where.suppliers = { some: { supplierId } };
  }

  // Handle complex status filters
  if (status === "LOW_STOCK") {
    where.OR = [
      { stock: { lte: 0 } },
      { stock: { lte: db.product.fields.minStock } }
    ];
  } else if (status === "OUT_OF_STOCK") {
    where.stock = { lte: 0 };
  } else if (status === "EXPIRING") {
    // Items with at least one batch expiring in the next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    where.stockEntries = {
      some: {
        expirationDate: {
          lte: threeDaysFromNow,
          gte: new Date(), // Filter out already expired if we only want "expiring soon"
        }
      }
    };
  }

  const [ingredients, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  const mappedData = JSON.parse(
    JSON.stringify(
      (ingredients as any[]).map((ingredient) => {
        const stock = Number(ingredient.stock);
        const minStock = Number(ingredient.minStock);

        const isOutOfStock = stock <= 0;
        const isLowStock = stock > 0 && stock <= minStock;

        return {
          id: ingredient.id,
          name: ingredient.name,
          type: ingredient.type,
          unit: ingredient.unit,
          unitLabel: UNIT_LABELS[ingredient.unit] || ingredient.unit,
          cost: Number(ingredient.cost),
          stock,
          minStock,
          isActive: ingredient.isActive,
          companyId: ingredient.companyId,
          createdAt: ingredient.createdAt,
          updatedAt: ingredient.updatedAt,
          expirationDate: ingredient.expirationDate,
          trackExpiration: ingredient.trackExpiration,
          expirationReminderDate: ingredient.expirationReminderDate,
          status: isOutOfStock
            ? "OUT_OF_STOCK"
            : isLowStock
            ? "LOW_STOCK"
            : "IN_STOCK",
        } as IngredientDto;
      }),
    ),
  );

  return { data: mappedData, total };
};

import "server-only";

import { db } from "@/app/_lib/prisma";
import { Product, ProductType, UnitType, Prisma } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { sanitizeUUID } from "@/app/_lib/uuid";

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
  stockStatus?: "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRING" | "OK";
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  page?: number;
  pageSize?: number;
  types?: ProductType[];
}

export interface GetIngredientsResponse {
  data: IngredientDto[];
  total: number;
}

export const getIngredients = async (
  params: GetIngredientsParams = {}
): Promise<GetIngredientsResponse> => {
  const companyId = await getCurrentCompanyId();
  const { search, supplierId, stockStatus, status = "ACTIVE", page = 1, pageSize = 10, types } = params;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: any = {
    companyId,
    type: types ? { in: types } : { in: ["INSUMO", "REVENDA"] },
  };

  if (status === "ACTIVE") {
    where.isActive = true;
  } else if (status === "INACTIVE") {
    where.isActive = false;
  }
  // status === "ALL" does not set isActive (shows both)

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  // UUID Sanitization & Validation (PostgreSQL 22P03 protection)
  const sanitizedSupplierId = sanitizeUUID(supplierId);

  if (sanitizedSupplierId) {
    where.suppliers = { some: { supplierId: sanitizedSupplierId } };
  }

  // Handle complex status filters
  if (stockStatus === "LOW_STOCK") {
    where.OR = [
      { stock: { lte: new Prisma.Decimal(0) } },
      { stock: { lte: db.product.fields.minStock } }
    ];
  } else if (stockStatus === "OUT_OF_STOCK") {
    where.stock = { lte: new Prisma.Decimal(0) };
  } else if (stockStatus === "EXPIRING") {
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

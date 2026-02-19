import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { StockMovementType } from "@prisma/client";

export interface StockMovementDto {
  id: string;
  type: StockMovementType;
  stockBefore: number;
  stockAfter: number;
  quantity: number;
  reason: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  product?: {
    name: string;
  } | null;
  ingredient?: {
    name: string;
  } | null;
}

interface GetStockMovementsParams {
  page?: number;
  pageSize?: number;
}

export const getStockMovements = async (
  params: GetStockMovementsParams = {}
): Promise<{ data: StockMovementDto[]; total: number }> => {
  const { page = 1, pageSize = 30 } = params;
  const skip = (page - 1) * pageSize;

  const companyId = await getCurrentCompanyId();

  const where = {
    companyId,
  };

  const [movements, total] = await Promise.all([
    db.stockMovement.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
        ingredient: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.stockMovement.count({ where }),
  ]);

  const data: StockMovementDto[] = movements.map((m) => ({
    id: m.id,
    type: m.type,
    stockBefore: Number(m.stockBefore),
    stockAfter: Number(m.stockAfter),
    quantity: Number(m.quantityDecimal ?? 0),
    reason: m.reason,
    createdAt: m.createdAt,
    user: m.user,
    product: m.product,
    ingredient: m.ingredient,
  }));

  return { data, total };
};

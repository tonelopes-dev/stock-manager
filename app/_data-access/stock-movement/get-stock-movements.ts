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
  unit: string | null;
  reason: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  } | null;
  product?: {
    name: string;
    unit: string;
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
            unit: true,
          },
        },
      },
    }),
    db.stockMovement.count({ where }),
  ]);

  const data: StockMovementDto[] = movements.map((m) => ({
    id: m.id,
    type: m.type,
    stockBefore: m.stockBefore.toNumber(),
    stockAfter: m.stockAfter.toNumber(),
    quantity: m.quantityDecimal ? m.quantityDecimal.toNumber() : 0,
    unit: m.unit, // Added unit from StockMovement
    reason: m.reason,
    createdAt: m.createdAt,
    user: m.user || { name: "Usuário Removido", email: "" },
    product: m.product,
  }));

  return { data, total };
};

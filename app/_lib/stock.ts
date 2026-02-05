import { db } from "./prisma";
import { StockMovementType, Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { BusinessError } from "./errors";

interface RecordStockMovementParams {
  productId: string;
  companyId: string;
  userId: string;
  type: StockMovementType;
  quantity: number; // Positive increases stock, negative decreases
  saleId?: string;
  reason?: string;
}

export const recordStockMovement = async (
  params: RecordStockMovementParams,
  trx?: Prisma.TransactionClient
) => {
  const execute = async (t: Prisma.TransactionClient) => {
    // 1. Update product and return state AFTER update to get stockAfter correctly
    const updatedProduct = await t.product.update({
      where: { id: params.productId },
      data: {
        stock: {
          increment: params.quantity,
        },
      },
      select: {
        stock: true,
        company: {
          select: { allowNegativeStock: true },
        },
      },
    });

    const stockAfter = updatedProduct.stock;
    const stockBefore = stockAfter - params.quantity;

    // 2. Validate negative stock AFTER update
    if (stockAfter < 0 && !updatedProduct.company.allowNegativeStock) {
      throw new BusinessError("Estoque insuficiente. A empresa não permite estoque negativo.");
    }

    // 3. Create movement record
    return await t.stockMovement.create({
      data: {
        productId: params.productId,
        companyId: params.companyId,
        userId: params.userId,
        type: params.type,
        saleId: params.saleId,
        reason: params.reason,
        stockBefore,
        stockAfter,
      },
    });
  };

  try {
    if (trx) {
      return await execute(trx);
    }

    return await db.$transaction(execute);
  } catch (error) {
    if (error instanceof BusinessError) {
      throw error;
    }

    Sentry.captureException(error, {
      tags: {
        feature: "inventory",
        action: "record_movement",
      },
      extra: { 
        payload: params 
      },
    });
    throw error;
  }
};

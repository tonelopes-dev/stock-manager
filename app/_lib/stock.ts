import { db } from "./prisma";
import { StockMovementType, Prisma } from "@prisma/client";
import { BusinessError } from "./errors";
import * as Sentry from "@sentry/nextjs";

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;

interface RecordStockMovementParams {
  productId?: string;
  ingredientId?: string;
  companyId: string;
  userId: string;
  type: StockMovementType;
  quantity: number | Decimal; // Positive increases stock, negative decreases
  saleId?: string;
  reason?: string;
}

export const recordStockMovement = async (
  params: RecordStockMovementParams,
  trx?: Prisma.TransactionClient
) => {
  const execute = async (t: Prisma.TransactionClient) => {
    const qty = new Decimal(params.quantity.toString());

    if (params.productId) {
      // 1. Update product
      const updatedProduct = await t.product.update({
        where: { id: params.productId },
        data: {
          stock: {
            increment: qty.toNumber(), // Product stock remains Int for now
          },
        },
        select: {
          stock: true,
          company: {
            select: { allowNegativeStock: true },
          },
        },
      });

      const stockAfter = new Decimal(updatedProduct.stock);
      const stockBefore = stockAfter.minus(qty);

      // 2. Validate negative stock
      if (stockAfter.lt(0) && !updatedProduct.company.allowNegativeStock) {
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
          quantityDecimal: qty,
        },
      });
    } else if (params.ingredientId) {
      // 1. Update ingredient
      const updatedIngredient = await t.ingredient.update({
        where: { id: params.ingredientId },
        data: {
          stock: {
            increment: qty,
          },
        },
        select: {
          stock: true,
          company: {
            select: { allowNegativeStock: true },
          },
        },
      });

      const stockAfter = new Decimal(updatedIngredient.stock.toString());
      const stockBefore = stockAfter.minus(qty);

      // 2. Validate negative stock
      if (stockAfter.lt(0) && !updatedIngredient.company.allowNegativeStock) {
        throw new BusinessError("Estoque insuficiente de insumo. A empresa não permite estoque negativo.");
      }

      // 3. Create movement record
      return await t.stockMovement.create({
        data: {
          ingredientId: params.ingredientId,
          companyId: params.companyId,
          userId: params.userId,
          type: params.type,
          saleId: params.saleId,
          reason: params.reason,
          stockBefore,
          stockAfter,
          quantityDecimal: qty,
        },
      });
    } else {
      throw new Error("Either productId or ingredientId must be provided.");
    }
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

import { db } from "./prisma";
import { StockMovementType, Prisma, UnitType } from "@prisma/client";
import { BusinessError } from "./errors";

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;

interface RecordStockMovementParams {
  productId: string;
  companyId: string;
  userId?: string | null;
  type: StockMovementType;
  quantity: number | Decimal; // Positive increases stock, negative decreases
  unit?: UnitType;
  saleId?: string;
  orderId?: string;
  reason?: string;
  forceAllowNegative?: boolean; // New flag for PDV recursive deduction
}

export const recordStockMovement = async (
  params: RecordStockMovementParams,
  trx?: Prisma.TransactionClient
) => {
  const execute = async (t: Prisma.TransactionClient) => {
    try {
      const qty = new Decimal(params.quantity.toString());

      // 1. Update product
      const updatedProduct = await t.product.update({
        where: { id: params.productId },
        data: {
          stock: {
            increment: qty,
          },
        },
        select: {
          stock: true,
          unit: true,
          company: {
            select: { allowNegativeStock: true },
          },
        },
      });

      const stockAfter = new Decimal(updatedProduct.stock.toString());
      const stockBefore = stockAfter.minus(qty);

      // 2. Validate negative stock (ignore if forceAllowNegative is true)
      if (
        stockAfter.lt(0) && 
        !updatedProduct.company.allowNegativeStock && 
        !params.forceAllowNegative
      ) {
        throw new BusinessError(
          "Estoque insuficiente. A empresa não permite estoque negativo."
        );
      }

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
          unit: params.unit || updatedProduct.unit,
          quantityDecimal: qty,
        },
      });
    } catch (err) {
      throw err;
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

    console.error(error);
    throw error;
  }
};

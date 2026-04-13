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
      console.log(`[STOCK_DEBUG] Product: ${updatedProduct.name}, StockAfter: ${stockAfter.toNumber()}, AllowNegative: ${updatedProduct.company.allowNegativeStock}, ForceAllow: ${params.forceAllowNegative}`);

      if (
        stockAfter.lt(0) && 
        !updatedProduct.company.allowNegativeStock && 
        !params.forceAllowNegative
      ) {
        console.log(`[STOCK_DEBUG] THROWING BusinessError for ${updatedProduct.name}`);
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
          orderId: params.orderId,
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

/**
 * Recursively processes stock movements for a product and its ingredients (Ficha Técnica).
 */
export async function processRecursiveStockMovement(
  params: RecordStockMovementParams,
  trx: Prisma.TransactionClient
) {
  const visited = new Set<string>();
  const { productId, quantity, companyId, userId, type, saleId, orderId, forceAllowNegative } = params;

  const recursive = async (pid: string, qty: Prisma.Decimal) => {
    if (visited.has(pid)) return;
    visited.add(pid);

    // Fetch product with its composition
    const product = await trx.product.findUnique({
      where: { id: pid },
      include: { parentCompositions: true },
    });

    if (!product) return;

    // 1. Record movement for the product itself (Only if NOT MTO)
    if (!product.isMadeToOrder) {
      await recordStockMovement(
        {
          productId: pid,
          companyId,
          userId,
          type,
          quantity: qty,
          saleId,
          orderId,
          forceAllowNegative: forceAllowNegative ?? true,
        },
        trx
      );
    }

    // 2. If it has children (Ficha Técnica / Composition), AND it's Made-to-Order, recurse
    if (product.isMadeToOrder && product.parentCompositions && product.parentCompositions.length > 0) {
      for (const comp of product.parentCompositions) {
        // The quantity of the child is: (quantity sold/moved) * (quantity in composition)
        const childQty = qty.mul(new Prisma.Decimal(comp.quantity.toString()));
        await recursive(comp.childId, childQty);
      }
    }

    visited.delete(pid);
  };

  await recursive(productId, new Prisma.Decimal(quantity.toString()));
}

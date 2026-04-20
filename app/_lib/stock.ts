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
  date?: Date;
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
          name: true,
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
          date: params.date || new Date(),
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

    const recursive = async (pid: string, qty: Prisma.Decimal, forceAllow?: boolean) => {
      if (visited.has(pid)) return;
      visited.add(pid);

      // Fetch product with its composition
      const product = await trx.product.findUnique({
        where: { id: pid },
        include: { parentCompositions: true },
      });

      if (!product) return;

      const hasIngredients = product.parentCompositions && product.parentCompositions.length > 0;
      
      // 1. Record movement for the product itself
      await recordStockMovement(
        {
          productId: pid,
          companyId,
          userId,
          type,
          quantity: qty,
          saleId,
          orderId,
          // Use provided forceAllow, or default to checking ingredients
          forceAllowNegative: forceAllow ?? (!product.isMadeToOrder || !hasIngredients ? forceAllowNegative : true),
        },
        trx
      );

      // 2. If it has children (Ficha Técnica / Composition), AND it's Made-to-Order, recurse
      if (product.isMadeToOrder && hasIngredients) {
        for (const comp of product.parentCompositions) {
          // The quantity of the child is: (quantity sold/moved) * (quantity in composition)
          const childQty = qty.mul(new Prisma.Decimal(comp.quantity.toString()));
          // For ingredients, we typically want to respect the company's negative stock setting
          // unless the whole movement was explicitly forced (which isn't the case for regular sales)
          await recursive(comp.childId, childQty, false);
        }
      }

      visited.delete(pid);
    };

    await recursive(productId, new Prisma.Decimal(quantity.toString()), forceAllowNegative);
}

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
          `Estoque insuficiente para ${updatedProduct.name}. A empresa não permite estoque negativo.`
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
 * Fetches products and their full composition tree using BFS to minimize database calls.
 * This is done BEFORE the transaction to avoid holding locks during the recursion logic.
 */
export async function getProductsWithFullTree(productIds: string[], companyId: string) {
  const allProducts = new Map<string, any>();
  let idsToFetch = Array.from(new Set(productIds));

  while (idsToFetch.length > 0) {
    const products = await db.product.findMany({
      where: {
        id: { in: idsToFetch },
        companyId,
      },
      include: {
        parentCompositions: true,
        company: { select: { allowNegativeStock: true } },
      },
    });

    const nextIds: string[] = [];
    for (const p of products) {
      allProducts.set(p.id, p);
      const isRecursive = p.isMadeToOrder || p.type === "COMBO";
      if (isRecursive && p.parentCompositions) {
        for (const comp of p.parentCompositions) {
          if (!allProducts.has(comp.childId)) {
            nextIds.push(comp.childId);
          }
        }
      }
    }
    // Only fetch IDs that we haven't fetched yet
    idsToFetch = nextIds.filter((id) => !allProducts.has(id));
  }

  return allProducts;
}

interface BatchMovementItem {
  productId: string;
  quantity: number | Decimal;
  type: StockMovementType;
  orderId?: string;
  saleId?: string;
  reason?: string;
  forceAllowNegative?: boolean;
  date?: Date;
}

/**
 * High-performance batch stock management engine.
 * 1. Simulations all changes in memory to validate rules.
 * 2. Prepares batch updates and creates.
 * 3. Executes everything in a single transactional block.
 */
export async function processBatchStockMovement(
  requestedMovements: BatchMovementItem[],
  companyId: string,
  userId: string | null,
  trx: Prisma.TransactionClient,
  preFetchedProducts?: Map<string, any>
) {
  // 1. Ensure we have all involved products (if not pre-fetched)
  const productMap = preFetchedProducts || await getProductsWithFullTree(
    requestedMovements.map(m => m.productId), 
    companyId
  );

  // 2. Simulation State (Keep track of simulated stock during the process)
  const simulatedStocks = new Map<string, Decimal>();
  for (const p of productMap.values()) {
    simulatedStocks.set(p.id, new Decimal(p.stock.toString()));
  }

  const pendingUpdates: { productId: string; delta: Decimal }[] = [];
  const pendingMovements: Prisma.StockMovementCreateManyInput[] = [];

  // 3. Recursive Simulation Logic (JS only, no DB calls)
  const computeRecursively = (pid: string, qty: Decimal, mParams: BatchMovementItem, forceAllow?: boolean) => {
    const product = productMap.get(pid);
    if (!product) return;

    const currentStock = simulatedStocks.get(pid)!;
    const newStock = currentStock.plus(qty);

    // Business Rules (Parity with recordStockMovement)
    const hasIngredients = product.parentCompositions && product.parentCompositions.length > 0;
    
    // Logic for forceAllowNegative parity
    const isForced = forceAllow ?? (product.isMadeToOrder && hasIngredients ? true : mParams.forceAllowNegative);

    if (newStock.lt(0) && !product.company.allowNegativeStock && !isForced) {
      throw new BusinessError(
        `Estoque insuficiente para ${product.name}. Saldo: ${currentStock.toNumber()}, Necessário: ${qty.negated().toNumber()}`
      );
    }

    // Update simulation state
    simulatedStocks.set(pid, newStock);
    pendingUpdates.push({ productId: pid, delta: qty });
    pendingMovements.push({
      productId: pid,
      companyId,
      userId,
      type: mParams.type,
      orderId: mParams.orderId,
      saleId: mParams.saleId,
      reason: mParams.reason,
      stockBefore: currentStock,
      stockAfter: newStock,
      quantityDecimal: qty,
      unit: product.unit,
      date: mParams.date || new Date(),
    });

    // Recurse if Made-to-Order or COMBO (Ficha Técnica)
    const shouldRecurse = (product.isMadeToOrder || product.type === "COMBO") && hasIngredients;
    if (shouldRecurse) {
      for (const comp of product.parentCompositions) {
        const childQty = qty.mul(new Decimal(comp.quantity.toString()));
        // For ingredients, we typically want to respect company settings (forceAllow=false)
        computeRecursively(comp.childId, childQty, mParams, false);
      }
    }
  };

  // Run simulation for all items in the request
  for (const m of requestedMovements) {
    computeRecursively(m.productId, new Decimal(m.quantity.toString()), m, m.forceAllowNegative);
  }

  // 4. Atomic Execution (Batch Writes)
  // Consolidated updates by product ID
  const consolidatedDeltas = new Map<string, Decimal>();
  for (const up of pendingUpdates) {
    const current = consolidatedDeltas.get(up.productId) || new Decimal(0);
    consolidatedDeltas.set(up.productId, current.plus(up.delta));
  }

  // Execute updates (Sequential in Prisma, but no I/O in between)
  for (const [pid, delta] of consolidatedDeltas.entries()) {
    await trx.product.update({
      where: { id: pid },
      data: { stock: { increment: delta } },
    });
  }

  // Execute movements in a single createMany (Massive performance boost)
  if (pendingMovements.length > 0) {
    await trx.stockMovement.createMany({ data: pendingMovements });
  }
}

/**
 * Recursively processes stock movements for a product and its ingredients (Ficha Técnica).
 * @deprecated Use processBatchStockMovement for bulk operations.
 */
export async function processRecursiveStockMovement(
  params: RecordStockMovementParams,
  trx: Prisma.TransactionClient
) {
  // Mantido para compatibilidade, mas encaminha para o motor de lote se possível
  return processBatchStockMovement([params], params.companyId, params.userId || null, trx);
}

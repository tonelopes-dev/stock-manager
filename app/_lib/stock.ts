import { db } from "./prisma";
import { StockMovementType, Prisma } from "@prisma/client";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (trx as any) || db;

  // Fetch product and company settings
  const product = await client.product.findUnique({
    where: { id: params.productId },
    select: { 
      stock: true,
      company: {
        select: { allowNegativeStock: true }
      }
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Perform update and create movement in a transaction to ensure integrity
  return await client.$transaction(async (innerTrx: Prisma.TransactionClient) => {
    // 1. Update product and return state AFTER update to get stockAfter correctly
    const updatedProduct = await innerTrx.product.update({
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
      throw new Error("Estoque insuficiente. A empresa não permite estoque negativo.");
    }

    // 3. Create movement record
    return await innerTrx.stockMovement.create({
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
  });
};

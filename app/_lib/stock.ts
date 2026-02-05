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

  const stockBefore = product.stock;
  const stockAfter = stockBefore + params.quantity;

  if (stockAfter < 0 && !product.company.allowNegativeStock) {
    throw new Error("Insufficient stock and negative stock is not allowed for this company.");
  }

  // Update product stock
  await client.product.update({
    where: { id: params.productId },
    data: { stock: stockAfter },
  });

  // Create movement record
  return await client.stockMovement.create({
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

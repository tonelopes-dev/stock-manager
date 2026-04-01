import { db } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";
import { BusinessError } from "@/app/_lib/errors";

interface AdjustIngredientStockParams {
  ingredientId: string;
  companyId: string;
  userId: string;
  quantity: number; // positive = IN, negative = OUT
  reason?: string;
}

export const IngredientService = {
  async adjustStock(
    params: AdjustIngredientStockParams,
    trx?: Prisma.TransactionClient,
  ) {
    const execute = async (t: Prisma.TransactionClient) => {
      // 1. Get current item and company settings
      const item = await t.product.findUnique({
        where: { id: params.ingredientId },
        select: {
          stock: true,
          unit: true,
          type: true,
          company: { select: { allowNegativeStock: true } },
        },
      });

      if (!item) {
        throw new BusinessError("Item não encontrado.");
      }

      const stockBefore = Number(item.stock);
      const stockAfter = stockBefore + params.quantity;

      // 2. Validate negative stock
      if (stockAfter < 0 && !item.company.allowNegativeStock) {
        throw new BusinessError(
          "Estoque insuficiente. A empresa não permite estoque negativo.",
        );
      }

      // 3. Update stock
      await t.product.update({
        where: { id: params.ingredientId },
        data: {
          stock: { increment: params.quantity },
        },
      });

      // 4. Create stock movement record
      return await t.stockMovement.create({
        data: {
          productId: params.ingredientId, // Unified table uses productId
          companyId: params.companyId,
          userId: params.userId,
          type: "MANUAL",
          quantityDecimal: params.quantity,
          stockBefore: stockBefore,
          stockAfter: stockAfter,
          unit: item.unit,
          reason: params.reason,
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

      console.error(error);
      throw error;
    }
  },
};

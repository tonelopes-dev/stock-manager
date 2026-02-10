import { db } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
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
      // 1. Get current ingredient and company settings
      const ingredient = await t.ingredient.findUnique({
        where: { id: params.ingredientId },
        select: {
          stock: true,
          company: { select: { allowNegativeStock: true } },
        },
      });

      if (!ingredient) {
        throw new BusinessError("Insumo não encontrado.");
      }

      const stockBefore = Number(ingredient.stock);
      const stockAfter = stockBefore + params.quantity;

      // 2. Validate negative stock
      if (stockAfter < 0 && !ingredient.company.allowNegativeStock) {
        throw new BusinessError(
          "Estoque insuficiente. A empresa não permite estoque negativo.",
        );
      }

      // 3. Update ingredient stock
      await t.ingredient.update({
        where: { id: params.ingredientId },
        data: {
          stock: { increment: params.quantity },
        },
      });

      // 4. Create stock movement record
      return await t.stockMovement.create({
        data: {
          ingredientId: params.ingredientId,
          companyId: params.companyId,
          userId: params.userId,
          type: "MANUAL",
          quantityDecimal: params.quantity,
          stockBefore: Math.round(stockBefore),
          stockAfter: Math.round(stockAfter),
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

      Sentry.captureException(error, {
        tags: {
          feature: "ingredient",
          action: "adjust_stock",
        },
        extra: { payload: params },
      });
      throw error;
    }
  },
};

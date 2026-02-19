import { db } from "@/app/_lib/prisma";
import { recordStockMovement } from "@/app/_lib/stock";
import * as Sentry from "@sentry/nextjs";
import { BusinessError } from "@/app/_lib/errors";
import { calculateRealCost } from "@/app/_lib/units";
import { UnitType } from "@prisma/client";

interface UpsertSaleParams {
  id?: string;
  date?: Date;
  companyId: string;
  userId: string;
  products: {
    id: string;
    quantity: number;
  }[];
}

export const SaleService = {
  async upsertSale({ id, date, companyId, userId, products }: UpsertSaleParams) {
    try {
      return await db.$transaction(async (trx) => {
        const isUpdate = Boolean(id);

        if (isUpdate) {
          const existingSale = await trx.sale.findFirst({
            where: { id, companyId },
            include: { saleItems: { include: { product: true } } },
          });

          if (!existingSale) {
            throw new BusinessError("Venda não encontrada.");
          }

          if (existingSale.status === "CANCELED") {
            throw new BusinessError("Não é possível editar uma venda cancelada.");
          }

          // 1. Revert stock for ALL product types (unified)
          for (const sp of existingSale.saleItems) {
            await recordStockMovement(
              {
                productId: sp.productId,
                companyId,
                userId,
                type: "CANCEL",
                quantity: sp.quantity,
                saleId: existingSale.id,
              },
              trx
            );
          }

          // 2. Clear old products
          await trx.saleItem.deleteMany({
            where: { saleId: id },
          });

          // 3. Update date
          await trx.sale.update({
            where: { id },
            data: {
              date: date || existingSale.date,
              userId,
            },
          });
        }

        // Create or use existing sale ID
        let saleId = id;
        if (!isUpdate) {
          const newSale = await trx.sale.create({
            data: {
              date: date || new Date(),
              companyId,
              userId,
            },
          });
          saleId = newSale.id;
        } else {
          // Update date for existing
          await trx.sale.update({
            where: { id: saleId, companyId },
            data: {
              date: date || undefined,
              userId,
            },
          });
        }

        const company = await trx.company.findUnique({
          where: { id: companyId },
          select: { allowNegativeStock: true },
        });

        // 4. Process products — unified for RESELL and PREPARED
        let totalAmount = 0;
        let totalCost = 0;

        for (const product of products) {
          const productFromDb = await trx.product.findUnique({
            where: { id: product.id },
            include: {
              recipes: {
                include: { ingredient: true }
              }
            }
          });

          if (!productFromDb) {
            throw new BusinessError(`Produto não encontrado: ${product.id}`);
          }

          if (!productFromDb.isActive) {
            throw new BusinessError(`O produto ${productFromDb.name} está desativado.`);
          }

          // Calculate point-in-time cost for PREPARED products
          let effectiveCost = Number(productFromDb.cost);
          if (productFromDb.type === "PREPARED" && productFromDb.recipes.length > 0) {
            const recipeCost = productFromDb.recipes.reduce((sum, recipe) => {
              const partialCost = calculateRealCost(
                recipe.quantity,
                recipe.unit as UnitType,
                recipe.ingredient.unit as UnitType,
                recipe.ingredient.cost
              );
              return sum + Number(partialCost);
            }, 0);
            effectiveCost = recipeCost;
          }

          // Validate stock (applies to both RESELL and PREPARED)
          const productIsOutOfStock = product.quantity > productFromDb.stock;
          if (productIsOutOfStock && !company?.allowNegativeStock) {
            throw new BusinessError(`Estoque insuficiente para o produto ${productFromDb.name}.`);
          }

          // Deduct product stock (SALE movement)
          await recordStockMovement(
            {
              productId: product.id,
              companyId,
              userId,
              type: "SALE",
              quantity: -product.quantity,
              saleId: saleId!,
            },
            trx
          );

          // Create SaleItem with historical cost
          await trx.saleItem.create({
            data: {
              saleId: saleId!,
              productId: product.id,
              quantity: product.quantity,
              unitPrice: productFromDb.price,
              baseCost: effectiveCost,
            },
          });

          totalAmount += Number(productFromDb.price) * product.quantity;
          totalCost += effectiveCost * product.quantity;
        }

        // 5. Update Sale header with final totals and return full object
        return await trx.sale.update({
          where: { id: saleId },
          data: {
            totalAmount,
            totalCost,
          },
        });

      });
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      
      Sentry.captureException(error, {
        tags: {
          feature: "sale",
          action: id ? "update" : "create",
        },
        extra: {
          companyId,
          userId,
          saleId: id,
          payload: { date, products },
        },
      });
      throw error;
    }
  },
};

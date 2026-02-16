import { db } from "@/app/_lib/prisma";
import { recordStockMovement } from "@/app/_lib/stock";
import * as Sentry from "@sentry/nextjs";
import { BusinessError } from "@/app/_lib/errors";
import { BOMService } from "./bom";

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

          // 1. Revert stock for existing products
          for (const sp of existingSale.saleItems) {
            if (sp.product.type === "RESELL") {
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
            } else {
              // PREPARED - For now, cancellation of PREPARED item 
              // doesn't restore ingredients automatically (BOM logic 
              // would need to be reversed). We keep it simple for Phase 1.
              // TODO: Implement Ingredient Reversion if needed.
            }
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
        let sale;
        if (isUpdate) {
          sale = { id: id! };
        } else {
          sale = await trx.sale.create({
            data: {
              date: date || new Date(),
              companyId,
              userId,
            },
          });
        }

        const company = await trx.company.findUnique({
          where: { id: companyId },
          select: { allowNegativeStock: true },
        });

        // 4. Process new products
        for (const product of products) {
          const productFromDb = await trx.product.findUnique({
            where: { id: product.id },
          });

          if (!productFromDb) {
            throw new BusinessError(`Produto não encontrado: ${product.id}`);
          }

          if (!productFromDb.isActive) {
            throw new BusinessError(`O produto ${productFromDb.name} está desativado.`);
          }

          let baseCost = productFromDb.cost;

          if (productFromDb.type === "RESELL") {
            const productIsOutOfStock = product.quantity > productFromDb.stock;
            if (productIsOutOfStock && !company?.allowNegativeStock) {
              throw new BusinessError(`Estoque insuficiente para o produto ${productFromDb.name}.`);
            }

            // Record stock movement (SALE type)
            await recordStockMovement(
              {
                productId: product.id,
                companyId,
                userId,
                type: "SALE",
                quantity: -product.quantity,
                saleId: sale.id,
              },
              trx
            );
          } else {
            // PREPARED - Explosão de BOM
            const realCost = await BOMService.explodeAndDeduct(
              {
                productId: product.id,
                quantity: product.quantity,
                companyId,
                userId,
                saleId: sale.id,
              },
              trx
            );
            
            // For prepared items, the real cost is the sum of ingredients
            baseCost = realCost.div(product.quantity);
          }

          // Create SaleItem with final historical values
          await trx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: product.id,
              quantity: product.quantity,
              unitPrice: productFromDb.price,
              baseCost: baseCost,
            },
          });
        }

        return sale;
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

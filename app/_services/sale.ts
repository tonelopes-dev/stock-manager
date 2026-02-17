import { db } from "@/app/_lib/prisma";
import { recordStockMovement } from "@/app/_lib/stock";
import * as Sentry from "@sentry/nextjs";
import { BusinessError } from "@/app/_lib/errors";

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

        // 4. Process products — unified for RESELL and PREPARED
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

          console.log(`[UPSERT_SALE] Processing product ${productFromDb.name} (${productFromDb.type})`);
          console.log(`[UPSERT_SALE] Stock: ${productFromDb.stock}, Requested: ${product.quantity}`);

          // Validate stock (applies to both RESELL and PREPARED)
          const productIsOutOfStock = product.quantity > productFromDb.stock;
          if (productIsOutOfStock && !company?.allowNegativeStock) {
            console.log(`[UPSERT_SALE] Insufficient stock for ${productFromDb.name}`);
            throw new BusinessError(`Estoque insuficiente para o produto ${productFromDb.name}.`);
          }

          // Deduct product stock (SALE movement)
          console.log(`[UPSERT_SALE] Recording stock movement for ${productFromDb.name}`);
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

          // Create SaleItem with historical cost
          console.log(`[UPSERT_SALE] Creating sale item for ${productFromDb.name}, cost: ${productFromDb.cost}`);
          await trx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: product.id,
              quantity: product.quantity,
              unitPrice: productFromDb.price,
              baseCost: productFromDb.cost,
            },
          });
        }

        return sale;
      });
    } catch (error) {
      console.error("[UPSERT_SALE_ERROR]", error);
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

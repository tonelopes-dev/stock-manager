import { db } from "@/app/_lib/prisma";
import { recordStockMovement } from "@/app/_lib/stock";

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
    return await db.$transaction(async (trx) => {
      const isUpdate = Boolean(id);

      if (isUpdate) {
        const existingSale = await trx.sale.findFirst({
          where: { id, companyId },
          include: { saleProducts: true },
        });

        if (!existingSale) {
          throw new Error("Venda não encontrada.");
        }

        if (existingSale.status === "CANCELED") {
          throw new Error("Não é possível editar uma venda cancelada.");
        }

        // 1. Revert stock for existing products
        for (const product of existingSale.saleProducts) {
          await recordStockMovement(
            {
              productId: product.productId,
              companyId,
              userId,
              type: "CANCEL",
              quantity: product.quantity,
              saleId: existingSale.id,
            },
            trx
          );
        }

        // 2. Clear old products
        await trx.saleProduct.deleteMany({
          where: { saleId: id },
        });

        // 3. Update date
        await trx.sale.update({
          where: { id },
          data: {
            date: date || existingSale.date,
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
          throw new Error(`Produto não encontrado: ${product.id}`);
        }

        if (!productFromDb.isActive) {
          throw new Error(`O produto ${productFromDb.name} está desativado.`);
        }

        const productIsOutOfStock = product.quantity > productFromDb.stock;
        if (productIsOutOfStock && !company?.allowNegativeStock) {
          throw new Error(`Estoque insuficiente para o produto ${productFromDb.name}.`);
        }

        // Create SaleProduct with historical values
        await trx.saleProduct.create({
          data: {
            saleId: sale.id,
            productId: product.id,
            quantity: product.quantity,
            unitPrice: productFromDb.price,
            baseCost: productFromDb.cost,
          },
        });

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
      }

      return sale;
    });
  },
};

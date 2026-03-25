import { db } from "@/app/_lib/prisma";
import { recordStockMovement } from "@/app/_lib/stock";
import { BusinessError } from "@/app/_lib/errors";
import { calculateRealCost } from "@/app/_lib/units";
import { UnitType, PaymentMethod } from "@prisma/client";

interface UpsertSaleParams {
  id?: string;
  orderId?: string;
  date?: Date;
  companyId: string;
  userId: string;
  customerId?: string;
  paymentMethod?: PaymentMethod;
  tipAmount?: number;
  deliveryFee?: number;
  products: {
    id: string;
    quantity: number;
  }[];
}

export const SaleService = {
  async upsertSale({ id, orderId, date, companyId, userId, customerId, paymentMethod, tipAmount, deliveryFee, products }: UpsertSaleParams) {
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
              customerId: customerId || null,
              orderId: orderId || null,
              paymentMethod: paymentMethod || null,
              tipAmount: tipAmount || 0,
              deliveryFee: deliveryFee || 0,
            },
          });
          saleId = newSale.id;
        } else {
          // Update date/customer for existing
          await trx.sale.update({
            where: { id: saleId, companyId },
            data: {
              date: date || undefined,
              userId,
              customerId: customerId || undefined,
              orderId: orderId || undefined,
              paymentMethod: paymentMethod || undefined,
              tipAmount: tipAmount !== undefined ? tipAmount : undefined,
              deliveryFee: deliveryFee !== undefined ? deliveryFee : undefined,
            },
          });
        }

        const company = await trx.company.findUnique({
          where: { id: companyId },
          select: { allowNegativeStock: true },
        });

        // 4. Process products — unified for RESELL and PREPARED
        let totalAmount = Number(deliveryFee || 0);
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

        const updatedSale = await trx.sale.update({
          where: { id: saleId },
          data: {
            totalAmount,
            totalCost,
          },
        });

        // 6. CRM Auto-upgrade (Move to Converted stage)
        if (customerId) {
          const convertedStage = await trx.cRMStage.findFirst({
            where: {
              companyId,
              name: {
                contains: "Convertido",
                mode: "insensitive",
              },
            },
          });

          if (convertedStage) {
            await trx.customer.update({
              where: { id: customerId },
              data: { stageId: convertedStage.id },
            });
          }
        }

        return updatedSale;

      });
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      
      console.error(error);
      throw error;
    }
  },
};

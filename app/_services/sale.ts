import { db } from "@/app/_lib/prisma";
import { recordStockMovement, processRecursiveStockMovement } from "@/app/_lib/stock";
import { BusinessError } from "@/app/_lib/errors";
import { PaymentMethod, Prisma } from "@prisma/client";

interface UpsertSaleParams {
  id?: string;
  date?: Date;
  companyId: string;
  userId: string;
  customerId?: string;
  paymentMethod?: PaymentMethod;
  tipAmount?: number;
  discountAmount?: number;
  extraAmount?: number;
  adjustmentReason?: string;
  isEmployeeSale?: boolean;
  products: {
    id: string;
    quantity: number;
  }[];
}

export const SaleService = {
  async upsertSale({ id, date, companyId, userId, customerId, paymentMethod, tipAmount, discountAmount = 0, extraAmount = 0, adjustmentReason, isEmployeeSale = false, products }: UpsertSaleParams) {
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

          // 1. Revert stock
          // We find all movements linked to this sale and revert them.
          const movements = await trx.stockMovement.findMany({
            where: { saleId: existingSale.id, companyId },
          });

          for (const movement of movements) {
            if (movement.productId) {
              await processRecursiveStockMovement(
                {
                  productId: movement.productId,
                  companyId,
                  userId,
                  type: "CANCEL",
                  quantity: movement.quantityDecimal ? new Prisma.Decimal(movement.quantityDecimal).negated() : 0,
                  saleId: existingSale.id,
                  forceAllowNegative: true,
                },
                trx
              );
            }
          }

          // 2. Clear old products
          await trx.saleItem.deleteMany({
            where: { saleId: id },
          });

          // 3. Update basic info (date/user)
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
              paymentMethod: paymentMethod || null,
              tipAmount: tipAmount || 0,
              discountAmount: discountAmount || 0,
              extraAmount: extraAmount || 0,
              adjustmentReason: adjustmentReason || null,
              isEmployeeSale,
            },
          });
          saleId = newSale.id;
        } else {
          // Update details for update mode
          await trx.sale.update({
            where: { id: saleId, companyId },
            data: {
              date: date || undefined,
              userId,
              customerId: customerId || undefined,
              paymentMethod: paymentMethod !== undefined ? paymentMethod : undefined,
              tipAmount: tipAmount !== undefined ? tipAmount : undefined,
              discountAmount: discountAmount !== undefined ? discountAmount : undefined,
              extraAmount: extraAmount !== undefined ? extraAmount : undefined,
              adjustmentReason: adjustmentReason !== undefined ? adjustmentReason : undefined,
              isEmployeeSale: isEmployeeSale !== undefined ? isEmployeeSale : undefined,
            },
          });
        }

        // 4. Process products with RECURSIVE deduction
        let totalAmount = 0;
        let totalCost = 0;

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

          // Recursive Stock Deduction
          await processRecursiveStockMovement(
            {
              productId: product.id,
              quantity: new Prisma.Decimal(product.quantity.toString()).negated(),
              companyId,
              userId,
              type: "SALE",
              saleId: saleId!,
              forceAllowNegative: productFromDb.isMadeToOrder, // MTO products bypass main stock check
            },
            trx
          );

           const unitPrice = isEmployeeSale
            ? Number(productFromDb.cost) + Number(productFromDb.operationalCost)
            : Number(productFromDb.price);

          // Create SaleItem with current cost SNAPSHOT
          await trx.saleItem.create({
            data: {
              saleId: saleId!,
              productId: product.id,
              quantity: product.quantity,
              unitPrice,
              baseCost: productFromDb.cost,
              operationalCost: productFromDb.operationalCost,
              totalAmount: new Prisma.Decimal(unitPrice).mul(product.quantity),
              totalCost: new Prisma.Decimal(productFromDb.cost).add(productFromDb.operationalCost).mul(product.quantity),
            },
          });

          totalAmount += unitPrice * product.quantity;
          totalCost += (Number(productFromDb.cost) + Number(productFromDb.operationalCost)) * product.quantity;
        }

        // Apply discount and ensure non-negative total
        const finalTotalAmount = Math.max(0, totalAmount - discountAmount);

        const updatedSale = await trx.sale.update({
          where: { id: saleId },
          data: {
            totalAmount: finalTotalAmount,
            totalCost,
          },
        });

        // 5. CRM Auto-upgrade (Converted stage)
        if (customerId) {
          const convertedStage = await trx.cRMStage.findFirst({
            where: {
              companyId,
              name: { contains: "Convertido", mode: "insensitive" },
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
      if (error instanceof BusinessError) throw error;
      console.error(error);
      throw error;
    }
  },
};

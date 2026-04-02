import { db } from "@/app/_lib/prisma";
import { recordStockMovement } from "@/app/_lib/stock";
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
  products: {
    id: string;
    quantity: number;
  }[];
}

/**
 * Recursively deducts stock for a product and its components.
 */
async function processDeduction(
  productId: string,
  quantity: number | Prisma.Decimal,
  companyId: string,
  userId: string,
  saleId: string,
  trx: Prisma.TransactionClient
) {
  // Use a map to prevent infinite loops should the UI validation fail
  const visited = new Set<string>();
  
  const recursive = async (pid: string, qty: Prisma.Decimal) => {
    if (visited.has(pid)) return;
    visited.add(pid);

    // Fetch product with its composition (child items)
    const product = await trx.product.findUnique({
      where: { id: pid },
      include: { parentCompositions: true },
    });

    if (!product) return;

    // Record movement for the product itself (Always deduct)
    await recordStockMovement(
      {
        productId: pid,
        companyId,
        userId,
        type: "SALE",
        quantity: qty.negated(),
        saleId,
        forceAllowNegative: true, // PDV recursive deduction never blocks
      },
      trx
    );

    // If it has children (COMBO or PRODUCAO_PROPRIA), recurse for each
    if (product.parentCompositions && product.parentCompositions.length > 0) {
      for (const comp of product.parentCompositions) {
        await recursive(comp.childId, qty.mul(comp.quantity));
      }
    }
    
    visited.delete(pid);
  };

  await recursive(productId, new Prisma.Decimal(quantity.toString()));
}

export const SaleService = {
  async upsertSale({ id, date, companyId, userId, customerId, paymentMethod, tipAmount, products }: UpsertSaleParams) {
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
              await recordStockMovement(
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
              paymentMethod: paymentMethod || undefined,
              tipAmount: tipAmount !== undefined ? tipAmount : undefined,
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
          await processDeduction(
            product.id,
            product.quantity,
            companyId,
            userId,
            saleId!,
            trx
          );

          // Create SaleItem with current cost SNAPSHOT
          await trx.saleItem.create({
            data: {
              saleId: saleId!,
              productId: product.id,
              quantity: product.quantity,
              unitPrice: productFromDb.price,
              baseCost: productFromDb.cost,
              operationalCost: productFromDb.operationalCost,
              totalAmount: new Prisma.Decimal(productFromDb.price).mul(product.quantity),
              totalCost: new Prisma.Decimal(productFromDb.cost).add(productFromDb.operationalCost).mul(product.quantity),
            },
          });

          totalAmount += Number(productFromDb.price) * product.quantity;
          totalCost += (Number(productFromDb.cost) + Number(productFromDb.operationalCost)) * product.quantity;
        }

        const updatedSale = await trx.sale.update({
          where: { id: saleId },
          data: {
            totalAmount,
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

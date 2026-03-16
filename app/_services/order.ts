import { db } from "@/app/_lib/prisma";
import { recordStockMovement } from "@/app/_lib/stock";
import { BusinessError } from "@/app/_lib/errors";
import { OrderStatus, Prisma } from "@prisma/client";
import { notifyKDS } from "@/app/api/kds/events/route";

interface CreateOrderParams {
  companyId: string;
  customerId?: string;
  tableNumber?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export const OrderService = {
  async createOrder({ companyId, customerId, tableNumber, notes, items }: CreateOrderParams) {
    try {
      return await db.$transaction(async (trx) => {
        // 1. Validate items and stock
        const itemsWithPrices = await Promise.all(
          items.map(async (item) => {
            const product = await trx.product.findUnique({
              where: { id: item.productId, companyId },
              select: { id: true, name: true, price: true, stock: true, isActive: true },
            });

            if (!product) {
              throw new BusinessError(`Produto não encontrado: ${item.productId}`);
            }

            if (!product.isActive) {
              throw new BusinessError(`O produto ${product.name} está desativado.`);
            }

            // Check stock level
            if (Number(item.quantity) > Number(product.stock)) {
              throw new BusinessError(`Estoque insuficiente para ${product.name}.`);
            }

            return {
              ...item,
              unitPrice: product.price,
              name: product.name,
            };
          })
        );

        const totalAmount = itemsWithPrices.reduce(
          (sum, item) => sum + Number(item.unitPrice) * item.quantity,
          0
        );

        // 2. Create the Order
        const order = await trx.order.create({
          data: {
            companyId,
            customerId: customerId || null,
            tableNumber,
            notes,
            totalAmount,
            status: OrderStatus.PENDING,
            orderItems: {
              create: itemsWithPrices.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
            },
          },
        });

        // 3. Reserve Stock (Immediate deduction upon PENDING as per design decision)
        // This ensures items are committed to the kitchen and prevents over-ordering.
        for (const item of itemsWithPrices) {
          await recordStockMovement(
            {
              productId: item.productId,
              companyId,
              userId: null, // Public menu orders have no authenticated user
              type: "ORDER",
              quantity: -item.quantity,
              orderId: order.id,
            },
            trx
          );
        }

        // 4. Notify KDS
        notifyKDS(companyId, { 
          type: "NEW_ORDER", 
          orderId: order.id,
          customerId: order.customerId 
        });

        return order;
      });
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      console.error("Error creating order:", error);
      throw new Error("Erro ao criar pedido.");
    }
  },

  async updateStatus(orderId: string, companyId: string, status: OrderStatus, userId: string) {
    try {
      return await db.$transaction(async (trx) => {
        const order = await trx.order.findUnique({
          where: { id: orderId, companyId },
          include: { orderItems: true },
        });

        if (!order) throw new BusinessError("Pedido não encontrado.");

        // If canceling, return Reserved Stock
        if (status === OrderStatus.CANCELED && order.status !== OrderStatus.CANCELED) {
          for (const item of order.orderItems) {
            await recordStockMovement(
              {
                productId: item.productId,
                companyId,
                userId,
                type: "CANCEL",
                quantity: Number(item.quantity),
                orderId: order.id,
              },
              trx
            );
          }
        }

        const updatedOrder = await trx.order.update({
          where: { id: orderId },
          data: { status },
        });

        // Notify KDS
        notifyKDS(companyId, { 
          type: "STATUS_UPDATED", 
          orderId, 
          status,
          customerId: order.customerId 
        });

        return updatedOrder;
      });
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      console.error("Error updating order status:", error);
      throw new Error("Erro ao atualizar status do pedido.");
    }
  },

  async convertToSale(orderId: string, companyId: string, userId: string, paymentMethod: any, tipAmount: number = 0) {
    try {
      return await db.$transaction(async (trx) => {
        const order = await trx.order.findUnique({
          where: { id: orderId, companyId },
          include: { orderItems: { include: { product: true } } },
        });

        if (!order) throw new BusinessError("Pedido não encontrado.");
        if (order.status === OrderStatus.PAID) throw new BusinessError("Este pedido já foi pago.");

        // 1. Create the Sale
        // Note: Stock was already deducted in createOrder (RESERVATION).
        // We link the sale to the order.
        const sale = await trx.sale.create({
          data: {
            companyId,
            userId,
            customerId: order.customerId,
            orderId: order.id,
            paymentMethod,
            totalAmount: order.totalAmount,
            tipAmount,
            date: new Date(),
            status: "ACTIVE",
          },
        });

        // 2. Create SaleItems using historical order prices
        for (const item of order.orderItems) {
          await trx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              baseCost: item.product.cost, // Use current cost for the sale record
            },
          });
          
          // Link stock movement to sale for better traceability (optional, but good)
          await trx.stockMovement.updateMany({
            where: { orderId: order.id, productId: item.productId, type: "ORDER" },
            data: { saleId: sale.id }
          });
        }

        // 3. Mark Order as PAID and complete
        await trx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAID },
        });

        return sale;
      });
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      console.error("Error converting order to sale:", error);
      throw new Error("Erro ao processar pagamento do pedido.");
    }
  },
  async convertItemsToSale(itemIds: string[], companyId: string, userId: string, paymentMethod: any, tipAmount: number = 0) {
    try {
      return await db.$transaction(async (trx) => {
        // 1. Fetch the items and their orders
        const items = await trx.orderItem.findMany({
          where: { id: { in: itemIds }, order: { companyId } },
          include: { order: true, product: { select: { cost: true } } },
        });

        if (items.length === 0) throw new BusinessError("Nenhum item encontrado.");

        const totalAmount = items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
        const originalOrderIds = Array.from(new Set(items.map((i) => i.orderId)));

        // 2. Create the Sale
        const sale = await trx.sale.create({
          data: {
            companyId,
            userId,
            customerId: items[0].order.customerId,
            paymentMethod,
            totalAmount,
            tipAmount,
            date: new Date(),
            status: "ACTIVE",
          },
        });

        // 3. Create SaleItems and link stock movement
        for (const item of items) {
          await trx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              baseCost: item.product.cost,
            },
          });

          // Link the "ORDER" stock movement to this sale
          await trx.stockMovement.updateMany({
            where: { orderId: item.orderId, productId: item.productId, type: "ORDER" },
            data: { saleId: sale.id },
          });

          // Delete the OrderItem
          await trx.orderItem.delete({ where: { id: item.id } });
        }

        // 4. Update order totals and cleanup empty orders
        for (const orderId of originalOrderIds) {
          const remainingItems = await trx.orderItem.findMany({ where: { orderId } });
          
          if (remainingItems.length === 0) {
            // No items left, delete the order (it's fully paid)
            await trx.order.delete({ where: { id: orderId } });
          } else {
            // Update totalAmount of the order
            const newTotal = remainingItems.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
            await trx.order.update({
              where: { id: orderId },
              data: { totalAmount: newTotal },
            });
          }
        }

        return sale;
      });
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      console.error("Error converting items to sale:", error);
      throw new Error("Erro ao processar pagamento parcial.");
    }
  },

  async deleteOrderItem(itemId: string, companyId: string, userId: string) {
    try {
      return await db.$transaction(async (trx) => {
        const item = await trx.orderItem.findUnique({
          where: { id: itemId, order: { companyId } },
          include: { order: true },
        });

        if (!item) throw new BusinessError("Item não encontrado.");

        // 1. Return stock
        await recordStockMovement(
          {
            productId: item.productId,
            companyId,
            userId,
            type: "CANCEL",
            quantity: Number(item.quantity),
            orderId: item.orderId,
            reason: "Cancelamento manual de item",
          },
          trx
        );

        // 2. Delete the item
        await trx.orderItem.delete({ where: { id: itemId } });

        // 3. Update order total or cleanup
        const remainingItems = await trx.orderItem.findMany({
          where: { orderId: item.orderId },
        });

        if (remainingItems.length === 0) {
          await trx.order.delete({ where: { id: item.orderId } });
        } else {
          const newTotal = remainingItems.reduce(
            (sum, i) => sum + Number(i.unitPrice) * Number(i.quantity),
            0
          );
          await trx.order.update({
            where: { id: item.orderId },
            data: { totalAmount: newTotal },
          });
        }

        return { success: true };
      });
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      console.error("Error deleting order item:", error);
      throw new Error("Erro ao cancelar item.");
    }
  },
};

import { db } from "@/app/_lib/prisma";
import { recordStockMovement, processRecursiveStockMovement, getProductsWithFullTree, processBatchStockMovement } from "@/app/_lib/stock";
import { BusinessError } from "@/app/_lib/errors";
import { AuditEventType, OrderStatus, Prisma } from "@prisma/client";
import { AuditService } from "./audit";

interface CreateOrderParams {
  companyId: string;
  customerId?: string;
  tableNumber?: string;
  notes?: string;
  hasServiceTax?: boolean;
  discountAmount?: number;
  extraAmount?: number;
  adjustmentReason?: string;
  isEmployeeSale?: boolean;
  items: {
    productId: string;
    quantity: number;
    notes?: string;
  }[];
}

export const OrderService = {
  async createOrder({ companyId, customerId, tableNumber, notes, hasServiceTax, discountAmount = 0, extraAmount = 0, adjustmentReason, isEmployeeSale = false, items }: CreateOrderParams) {
    try {
      // 1. Fetch all products AND their full composition tree BEFORE the transaction
      const initialProductIds = items.map(i => i.productId);
      const fullProductMap = await getProductsWithFullTree(initialProductIds, companyId);

      const order = await db.$transaction(async (trx) => {
        const itemsWithPrices = items.map((item) => {
          const product = fullProductMap.get(item.productId);

          if (!product) {
            throw new BusinessError(`Produto não encontrado: ${item.productId}`);
          }

          if (!product.isActive) {
            throw new BusinessError(`O produto ${product.name} está desativado.`);
          }

          const unitPrice = isEmployeeSale 
            ? Number(product.cost) + Number(product.operationalCost)
            : Number(product.price);

          return {
            ...item,
            unitPrice,
            name: product.name,
          };
        });

        const subtotal = itemsWithPrices.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );

        // Apply service tax if active
        const serviceTax = hasServiceTax ?? true 
          ? Math.round(subtotal * 0.1 * 100) / 100 
          : 0;

        const totalAmount = Math.max(0, subtotal + serviceTax - discountAmount + extraAmount);

        // 2. Create the Order
        const order = await trx.order.create({
          data: {
            companyId,
            customerId: customerId || null,
            tableNumber,
            notes,
            totalAmount,
            discountAmount: discountAmount || 0,
            extraAmount: extraAmount || 0,
            adjustmentReason: adjustmentReason || null,
            isEmployeeSale: isEmployeeSale || false,
            hasServiceTax: hasServiceTax !== undefined ? hasServiceTax : true,
            status: OrderStatus.PENDING,
            orderItems: {
              create: itemsWithPrices.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                notes: item.notes,
                status: OrderStatus.PENDING,
              })),
            },
          },
        });

        // 3. Batch Stock Deduction (Simulation + Batch Writes)
        await processBatchStockMovement(
          itemsWithPrices.map(item => ({
            productId: item.productId,
            quantity: new Prisma.Decimal(item.quantity.toString()).negated(),
            type: "ORDER",
            orderId: order.id,
          })),
          companyId,
          null, // userId
          trx,
          fullProductMap // Pass pre-fetched map to avoid new queries
        );

        await AuditService.logWithTransaction(trx, {
          type: AuditEventType.ORDER_CREATED,
          companyId,
          customerId,
          entityType: "ORDER",
          entityId: order.id,
          metadata: {
            totalAmount: Number(order.totalAmount),
            itemsCount: items.length,
          },
        });

        return order;
      }, {
        timeout: 20000, 
      });

      return order;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      console.error("Error creating order:", error);
      throw new Error("Erro ao criar pedido.");
    }
  },

  async updateOrderItemStatus(itemId: string, companyId: string, status: OrderStatus, userId: string) {
    try {
      const { updatedItem } = await db.$transaction(async (trx) => {
        // 1. Update the item
        const item = await trx.orderItem.findUnique({
          where: { id: itemId, order: { companyId } },
          select: { id: true, orderId: true },
        });

        if (!item) throw new BusinessError("Item não encontrado.");

        const updatedItem = await trx.orderItem.update({
          where: { id: itemId },
          data: { status },
        });

        // 2. Sync order status based on all items
        const allItems = await trx.orderItem.findMany({
          where: { orderId: item.orderId },
          select: { status: true },
        });

        let newOrderStatus: OrderStatus = OrderStatus.PENDING;
        
        const hasPreparing = allItems.some(i => i.status === OrderStatus.PREPARING);
        const allReady = allItems.every(i => 
          i.status === OrderStatus.READY || 
          i.status === OrderStatus.DELIVERED || 
          i.status === OrderStatus.PAID
        );

        if (allReady) {
          newOrderStatus = OrderStatus.READY;
        } else if (hasPreparing) {
          newOrderStatus = OrderStatus.PREPARING;
        } else {
          const hasReady = allItems.some(i => i.status === OrderStatus.READY);
          if (hasReady) newOrderStatus = OrderStatus.PREPARING;
        }

        await trx.order.update({
          where: { id: item.orderId },
          data: { status: newOrderStatus },
        });

        return { updatedItem };
      });

      return updatedItem;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      console.error("Error updating item status:", error);
      throw new Error("Erro ao atualizar item.");
    }
  },

  async updateStatus(orderId: string, companyId: string, status: OrderStatus, userId: string) {
    try {
      const updatedOrder = await db.$transaction(async (trx) => {
        const order = await trx.order.findUnique({
          where: { id: orderId, companyId },
          include: { orderItems: true },
        });

        if (!order) throw new BusinessError("Pedido não encontrado.");

        // If canceling, return Reserved Stock
        if (status === OrderStatus.CANCELED && order.status !== OrderStatus.CANCELED) {
          await processBatchStockMovement(
            order.orderItems.map(item => ({
              productId: item.productId,
              quantity: new Prisma.Decimal(item.quantity.toString()),
              type: "CANCEL",
              orderId: order.id,
              reason: "Cancelamento do pedido",
            })),
            companyId,
            userId,
            trx
          );
        }

        const updatedOrder = await trx.order.update({
          where: { id: orderId },
          data: { status },
        });

        return updatedOrder;
      });

      return updatedOrder;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      console.error("Error updating order status:", error);
      throw new Error("Erro ao atualizar status do pedido.");
    }
  },

  async convertToSale(orderId: string, companyId: string, userId: string, paymentMethod: any, tipAmount: number = 0, discountAmount: number = 0, extraAmount: number = 0, adjustmentReason?: string, isEmployeeSale: boolean = false) {
    try {
      const sale = await db.$transaction(async (trx) => {
        const order = await trx.order.findUnique({
          where: { id: orderId, companyId },
          include: { orderItems: { include: { product: true } } },
        });

        if (!order) throw new BusinessError("Pedido não encontrado.");
        
        const existingSale = await trx.sale.findUnique({
          where: { orderId }
        });

        if (existingSale) {
          if (order.status !== OrderStatus.PAID) {
            await trx.order.update({
              where: { id: orderId },
              data: { status: OrderStatus.PAID }
            });
          }
          return existingSale;
        }

        if (order.status === OrderStatus.PAID) throw new BusinessError("Este pedido já foi pago.");

        const subtotal = order.orderItems.reduce((acc, item) => {
          const price = isEmployeeSale 
            ? (Number(item.product.cost || 0) + Number(item.product.operationalCost || 0))
            : Number(item.unitPrice);
          return acc + price * Number(item.quantity);
        }, 0);

        const totalWithTip = Math.max(0, subtotal + tipAmount - discountAmount + extraAmount);

        const sale = await trx.sale.create({
          data: {
            companyId,
            userId,
            customerId: order.customerId,
            orderId: order.id,
            paymentMethod,
            totalAmount: totalWithTip,
            discountAmount,
            extraAmount,
            adjustmentReason,
            isEmployeeSale,
            tipAmount,
            date: new Date(),
            status: "ACTIVE",
          },
        });

        await trx.saleItem.createMany({
          data: order.orderItems.map((item) => {
            const unitPrice = isEmployeeSale
              ? (Number(item.product.cost || 0) + Number(item.product.operationalCost || 0))
              : Number(item.unitPrice);

            return {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: unitPrice,
              baseCost: item.product.cost,
            };
          }),
        });

        await trx.stockMovement.updateMany({
          where: { orderId: order.id, type: "ORDER" },
          data: { saleId: sale.id }
        });

        await trx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAID },
        });

        await trx.orderItem.updateMany({
          where: { orderId: order.id },
          data: { status: OrderStatus.PAID },
        });

        return sale;
      });

      return sale;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      console.error("Error converting order to sale:", error);
      throw new Error("Erro ao processar pagamento do pedido.");
    }
  },

  async convertItemsToSale(itemIds: string[], companyId: string, userId: string, paymentMethod: any, tipAmount: number = 0, discountAmount: number = 0, extraAmount: number = 0, adjustmentReason?: string, isEmployeeSale: boolean = false) {
    try {
      const { sale } = await db.$transaction(async (trx) => {
        const items = await trx.orderItem.findMany({
          where: { id: { in: itemIds }, order: { companyId } },
          include: { order: true, product: { select: { cost: true, operationalCost: true } } },
        });

        if (items.length === 0) throw new BusinessError("Nenhum item encontrado.");

        const subtotal = items.reduce((acc, item) => {
          const price = isEmployeeSale 
            ? (Number(item.product.cost || 0) + Number(item.product.operationalCost || 0))
            : Number(item.unitPrice);
          return acc + price * Number(item.quantity);
        }, 0);

        const totalAmount = Math.max(0, subtotal + tipAmount - discountAmount + extraAmount);
        const originalOrderIds = Array.from(new Set(items.map((i) => i.orderId)));

        const sale = await trx.sale.create({
          data: {
            companyId,
            userId,
            customerId: items[0].order.customerId,
            paymentMethod,
            totalAmount,
            tipAmount,
            discountAmount,
            extraAmount,
            adjustmentReason,
            isEmployeeSale,
            date: new Date(),
            status: "ACTIVE",
          },
        });

        for (const item of items) {
          const unitPrice = isEmployeeSale
            ? (Number(item.product.cost || 0) + Number(item.product.operationalCost || 0))
            : Number(item.unitPrice);

          await trx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: unitPrice,
              baseCost: item.product.cost,
            },
          });

          await trx.stockMovement.updateMany({
            where: { orderId: item.orderId, productId: item.productId, type: "ORDER" },
            data: { saleId: sale.id },
          });

          await trx.orderItem.delete({ where: { id: item.id } });
        }

        for (const orderId of originalOrderIds) {
          const remainingItems = await trx.orderItem.findMany({ where: { orderId } });
          
          if (remainingItems.length === 0) {
            await trx.order.delete({ where: { id: orderId } });
          } else {
            const newTotal = remainingItems.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
            await trx.order.update({
              where: { id: orderId },
              data: { totalAmount: newTotal },
            });
          }
        }

        return { sale };
      });

      return sale;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      console.error("Error converting items to sale:", error);
      throw new Error("Erro ao processar pagamento parcial.");
    }
  },

  async deleteOrderItem(itemId: string, companyId: string, userId: string) {
    try {
      await db.$transaction(async (trx) => {
        const item = await trx.orderItem.findUnique({
          where: { id: itemId, order: { companyId } },
          include: { order: true },
        });

        if (!item) throw new BusinessError("Item não encontrado.");

        await processRecursiveStockMovement(
          {
            productId: item.productId,
            companyId,
            userId,
            type: "CANCEL",
            quantity: new Prisma.Decimal(item.quantity.toString()),
            orderId: item.orderId,
            reason: "Cancelamento manual de item",
          },
          trx
        );

        await trx.orderItem.delete({ where: { id: itemId } });

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
      });

      return { success: true };
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      console.error("Error deleting order item:", error);
      throw new Error("Erro ao cancelar item.");
    }
  },
};

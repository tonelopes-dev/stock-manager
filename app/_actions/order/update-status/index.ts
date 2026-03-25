"use server";

import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { IfoodOrderService } from "@/app/_services/ifood/order-service";
import { SaleService } from "@/app/_services/sale";

const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.nativeEnum(OrderStatus),
  companyId: z.string(),
});

export const updateOrderStatusAction = actionClient
  .schema(updateOrderStatusSchema)
  .action(async ({ parsedInput: { orderId, status, companyId } }) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    try {
      const order = await db.order.findUnique({
        where: { id: orderId },
        select: { source: true, status: true }
      });

      const oldStatus = order?.status;
      await OrderService.updateStatus(orderId, companyId, status, session.user.id);
      
      // 1. Create Status History Record
      await db.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: oldStatus,
          toStatus: status,
          actorId: session.user.id,
        }
      });

      // 2. Ifood Integration: 
      // Confirm if moving to PREPARING
      if (order?.source === "IFOOD" && status === OrderStatus.PREPARING) {
        await IfoodOrderService.confirmOrder(orderId, companyId);
      }
      
      // Dispatch if moving to DELIVERED
      if (order?.source === "IFOOD" && status === OrderStatus.DELIVERED) {
        await IfoodOrderService.dispatchOrder(orderId, companyId);
      }

      // 3. Create Sale if moving to DELIVERED (Financial closing)
      if (status === OrderStatus.DELIVERED) {
        const orderWithItems = await db.order.findUnique({
          where: { id: orderId },
          include: { 
            orderItems: true, 
            sale: { select: { id: true } } 
          }
        });

        if (orderWithItems && !orderWithItems.sale) {
          await SaleService.upsertSale({
            orderId: orderWithItems.id,
            companyId,
            userId: session.user.id,
            customerId: orderWithItems.customerId || undefined,
            deliveryFee: Number(orderWithItems.deliveryFee || 0),
            products: orderWithItems.orderItems.map(item => ({
              id: item.productId,
              quantity: Number(item.quantity)
            }))
          });
        }
      }

      // 4. Sync all clients (Single call)
      const { notifyKDS } = await import("@/app/api/kds/events/route");
      notifyKDS(companyId, {
        type: "STATUS_UPDATED",
        orderId,
        status,
      });

      revalidatePath(`/kds`);
      revalidatePath(`/(protected)/sales`);
      
      return { success: true };
    } catch (error: any) {
      console.error("Update Status Action Error:", error);
      throw new Error(error.message || "Falha ao atualizar status do pedido.");
    }
  });

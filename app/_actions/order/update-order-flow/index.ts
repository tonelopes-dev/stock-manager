"use server";

import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { BusinessError } from "@/app/_lib/errors";

const updateOrderFlowSchema = z.object({
  orderId: z.string(),
  status: z.nativeEnum(OrderStatus),
  companyId: z.string(),
  environmentId: z.string().optional(),
});

export const updateOrderFlowAction = actionClient
  .schema(updateOrderFlowSchema)
  .action(async ({ parsedInput: { orderId, status, companyId, environmentId } }) => {

    // 1. Single Auth Call
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    try {
      // 2. Single Transaction for everything
      await db.$transaction(async (trx) => {
        // 1. Update items (all or filtered by environment)
        await trx.orderItem.updateMany({
          where: { 
            orderId: orderId,
            ...(environmentId && environmentId !== "all" ? { product: { environmentId } } : {})
          },
          data: { status },
        });

        // 2. Fetch all items to determine new order status
        const allItems = await trx.orderItem.findMany({
          where: { orderId: orderId },
          select: { status: true },
        });

        let newOrderStatus: OrderStatus = OrderStatus.PENDING;
        
        const allDelivered = allItems.every(i => i.status === OrderStatus.DELIVERED || i.status === OrderStatus.PAID);
        const allReady = allItems.every(i => 
          i.status === OrderStatus.READY || 
          i.status === OrderStatus.DELIVERED || 
          i.status === OrderStatus.PAID
        );
        const hasPreparing = allItems.some(i => i.status === OrderStatus.PREPARING);
        const hasReady = allItems.some(i => i.status === OrderStatus.READY);

        if (allDelivered) {
          newOrderStatus = OrderStatus.DELIVERED;
        } else if (allReady) {
          newOrderStatus = OrderStatus.READY;
        } else if (hasPreparing || hasReady) {
          newOrderStatus = OrderStatus.PREPARING;
        }

        console.log(`[updateOrderFlow] Order: ${orderId} | Action Status: ${status} | New Calculated Status: ${newOrderStatus}`);

        // 3. Update the order status
        await trx.order.update({
          where: { id: orderId },
          data: { status: newOrderStatus },
        });
      });

      // 3. Revalidation
      revalidatePath(`/kds`, "page");
      revalidatePath(`/sales`, "page");
      revalidatePath(`/menu/${companyId}/my-orders`, "page");
      
      return { success: true };
    } catch (error: any) {
      console.error("Update Order Flow Action Error:", error);
      throw new Error(error.message || "Falha ao atualizar fluxo do pedido.");
    }
  });

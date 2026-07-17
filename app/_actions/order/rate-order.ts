"use server";

import { broadcastKdsEvent } from "@/app/_lib/kds-broadcast";
import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";

const rateOrderSchema = z.object({
  orderId: z.string().min(1),
  companyId: z.string().min(1),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

export const rateOrderAction = actionClient
  .schema(rateOrderSchema)
  .action(async ({ parsedInput: { orderId, companyId, rating, feedback } }) => {
    
    // Apenas pedidos que pertençam a esta empresa
    const order = await db.order.findUnique({
      where: { id: orderId, companyId },
    });

    if (!order) {
      throw new Error("Pedido não encontrado.");
    }

    if (order.rating) {
      throw new Error("Este pedido já foi avaliado.");
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        rating,
        feedback,
      },
    });

    // Opcional: Emitir um evento KDS para avisar o restaurante de um novo feedback
    await broadcastKdsEvent(companyId, "update_order", { orderId, status: order.status, hasNewFeedback: true });

    return { success: true };
  });

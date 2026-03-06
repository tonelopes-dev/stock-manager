"use server";

import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/app/_lib/auth";

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
      await OrderService.updateStatus(orderId, companyId, status, session.user.id);
      
      revalidatePath(`/kds`);
      
      return { success: true };
    } catch (error: any) {
      console.error("Update Status Action Error:", error);
      throw new Error(error.message || "Falha ao atualizar status do pedido.");
    }
  });

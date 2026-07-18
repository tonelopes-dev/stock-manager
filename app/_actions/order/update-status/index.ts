"use server";

import { auth } from "@/app/_lib/auth";
import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
      
      revalidatePath(`/kds`, "page");
      revalidatePath(`/sales`, "page");
      revalidatePath(`/menu/${companyId}/my-orders`, "page");
      
      return { success: true };
    } catch (error: unknown) {
      console.error("Update Status Action Error:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Falha ao atualizar status do pedido.");
    }
  });

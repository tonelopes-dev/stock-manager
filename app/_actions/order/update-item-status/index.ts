"use server";

import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/app/_lib/auth";

const updateItemStatusSchema = z.object({
  itemId: z.string(),
  status: z.nativeEnum(OrderStatus),
  companyId: z.string(),
});

export const updateItemStatusAction = actionClient
  .schema(updateItemStatusSchema)
  .action(async ({ parsedInput: { itemId, status, companyId } }) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    try {
      await OrderService.updateOrderItemStatus(itemId, companyId, status, session.user.id);
      
      revalidatePath(`/kds`, "page");
      revalidatePath(`/sales`, "page");
      revalidatePath(`/menu/${companyId}/my-orders`, "page");
      
      return { success: true };
    } catch (error: any) {
      console.error("Update Item Status Action Error:", error);
      throw new Error(error.message || "Falha ao atualizar status do item.");
    }
  });

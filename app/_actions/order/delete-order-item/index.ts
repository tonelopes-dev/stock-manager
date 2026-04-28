"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { revalidatePath } from "next/cache";
import { auth } from "@/app/_lib/auth";
import { deleteOrderItemSchema } from "./schema";

export const deleteOrderItemAction = actionClient
  .schema(deleteOrderItemSchema)
  .action(async ({ parsedInput: { itemId, companyId } }) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    try {
      await OrderService.deleteOrderItem(itemId, companyId, session.user.id);

      revalidatePath(`/sales`, "page");
      revalidatePath(`/kds`, "page");
      revalidatePath(`/menu/${companyId}/my-orders`, "page");

      return { success: true };
    } catch (error: any) {
      console.error("Delete Order Item Error:", error);
      throw new Error(error.message || "Falha ao cancelar item.");
    }
  });

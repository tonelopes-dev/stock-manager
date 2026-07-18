"use server";

import { auth } from "@/app/_lib/auth";
import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { revalidatePath } from "next/cache";
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
    } catch (error: unknown) {
      console.error("Delete Order Item Error:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Falha ao cancelar item.");
    }
  });

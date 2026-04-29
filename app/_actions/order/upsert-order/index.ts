"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { revalidatePath } from "next/cache";
import { upsertOrderSchema } from "./schema";

export const upsertOrderAction = actionClient
  .schema(upsertOrderSchema)
  .action(async ({ parsedInput: { companyId, customerId, items, tableNumber, notes, discountAmount, extraAmount, adjustmentReason, isEmployeeSale, hasServiceTax } }) => {
    try {
      // Reusing createOrder which effectively "upserts" into the customer's comanda (aggregate of pending orders)
      const order = await OrderService.createOrder({
        companyId,
        customerId,
        items,
        tableNumber,
        notes,
        discountAmount,
        extraAmount,
        adjustmentReason: adjustmentReason || undefined,
        isEmployeeSale,
        hasServiceTax,
      });

      revalidatePath(`/sales`, "page");
      revalidatePath(`/kds`, "page");
      revalidatePath(`/menu/${companyId}/my-orders`, "page");
      
      return { success: true, orderId: order.id };
    } catch (error: any) {
      console.error("Upsert Order Action Error:", error);
      throw new Error(error.message || "Falha ao adicionar itens à comanda.");
    }
  });

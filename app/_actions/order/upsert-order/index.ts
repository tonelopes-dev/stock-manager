"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { revalidatePath } from "next/cache";
import { upsertOrderSchema } from "./schema";
import { getKDSOrders } from "@/app/_data-access/order/get-kds-orders";
import { broadcastKdsEvent } from "@/app/_lib/kds-broadcast";

export const upsertOrderAction = actionClient
  .schema(upsertOrderSchema)
  .action(async ({ parsedInput: { companyId, customerId, items, tableNumber, notes, discountAmount, extraAmount, adjustmentReason, isEmployeeSale, hasServiceTax } }) => {
    try {
      // Reusing createOrder which effectively "upserts" into the customer's comanda
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

      // Fetch the fully mapped DTO after commit so the broadcast payload matches
      // exactly the same shape as the initial Server Component load.
      // This eliminates any secondary SELECT from the browser (anon has no SELECT access).
      const kdsOrders = await getKDSOrders(companyId);
      const kdsOrder = kdsOrders.find((o) => o.id === order.id);

      if (kdsOrder) {
        // subscribe → send → removeChannel: waits for WS handshake before firing
        await broadcastKdsEvent(companyId, "new_order", {
          ...kdsOrder,
          createdAt: kdsOrder.createdAt.toISOString(),
        });
      }

      revalidatePath(`/sales`, "page");
      revalidatePath(`/kds`, "page");
      revalidatePath(`/menu/${companyId}/my-orders`, "page");

      return { success: true, orderId: order.id };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao adicionar itens à comanda.";
      console.error("Upsert Order Action Error:", error);
      throw new Error(message);
    }
  });

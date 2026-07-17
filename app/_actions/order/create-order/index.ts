"use server";

import { getKDSOrders } from "@/app/_data-access/order/get-kds-orders";
import { broadcastKdsEvent } from "@/app/_lib/kds-broadcast";
import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createOrderSchema = z.object({
  companyId: z.string(),
  customerId: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    notes: z.string().optional(),
  })),
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
  hasServiceTax: z.boolean().optional(),
  discountAmount: z.number().min(0).default(0),
  extraAmount: z.number().min(0).default(0),
  adjustmentReason: z.string().optional().nullable(),
  isEmployeeSale: z.boolean().default(false),
});

export const createOrderAction = actionClient
  .schema(createOrderSchema)
  .action(async ({ parsedInput: { companyId, customerId, items, tableNumber, notes, hasServiceTax, discountAmount, extraAmount, adjustmentReason, isEmployeeSale } }) => {
    try {
      const order = await OrderService.createOrder({
        companyId,
        customerId: customerId || undefined,
        items,
        tableNumber,
        notes,
        hasServiceTax,
        discountAmount,
        extraAmount,
        adjustmentReason: adjustmentReason || undefined,
        isEmployeeSale,
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

      revalidatePath(`/kds`, "page");
      revalidatePath(`/sales`, "page");
      revalidatePath(`/menu/${companyId}/my-orders`, "page");

      return { success: true, orderId: order.id };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao processar pedido.";
      console.error("Order Action Error:", error);
      throw new Error(message);
    }
  });

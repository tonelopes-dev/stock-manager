"use server";

import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { revalidatePath } from "next/cache";

const createOrderSchema = z.object({
  companyId: z.string(),
  customerId: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })),
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
  hasServiceTax: z.boolean().optional(),
});

export const createOrderAction = actionClient
  .schema(createOrderSchema)
  .action(async ({ parsedInput: { companyId, customerId, items, tableNumber, notes, hasServiceTax } }) => {
    try {
      const order = await OrderService.createOrder({
        companyId,
        customerId: customerId || undefined,
        items,
        tableNumber,
        notes,
        hasServiceTax,
      });

      revalidatePath(`/kds`);
      
      return { success: true, orderId: order.id };
    } catch (error: any) {
      console.error("Order Action Error:", error);
      throw new Error(error.message || "Falha ao processar pedido.");
    }
  });

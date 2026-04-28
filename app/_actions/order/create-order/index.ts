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

      revalidatePath(`/kds`, "page");
      revalidatePath(`/sales`, "page");
      revalidatePath(`/menu/${companyId}/my-orders`, "page");
      
      return { success: true, orderId: order.id };
    } catch (error: any) {
      console.error("Order Action Error:", error);
      throw new Error(error.message || "Falha ao processar pedido.");
    }
  });

"use server";

import { auth } from "@/app/_lib/auth";
import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { PaymentMethod, SaleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const convertOrderToSaleSchema = z.object({
  orderIds: z.array(z.string()),
  companyId: z.string(),
  paymentMethod: z.nativeEnum(PaymentMethod).nullable().optional(),
  tipAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  extraAmount: z.number().min(0).default(0),
  adjustmentReason: z.string().optional().nullable(),
  isEmployeeSale: z.boolean().default(false),
  status: z.enum(["ACTIVE", "DRAFT", "PENDING_PAYMENT"]).optional().default("ACTIVE"),
  dueDate: z.date().optional().nullable(),
  customerId: z.string().optional().nullable(),
});

export const convertOrderToSaleAction = actionClient
  .schema(convertOrderToSaleSchema)
  .action(async ({ parsedInput: { orderIds, companyId, paymentMethod, tipAmount, discountAmount, extraAmount, adjustmentReason, isEmployeeSale, status, dueDate, customerId } }) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    try {
      const sale = await OrderService.convertToSale({
        orderIds,
        companyId,
        userId: session.user.id,
        paymentMethod: paymentMethod || null,
        tipAmount,
        discountAmount,
        extraAmount,
        adjustmentReason: adjustmentReason || undefined,
        isEmployeeSale,
        status: status as SaleStatus,
        dueDate,
        customerId,
      });

      revalidatePath(`/sales`, "page");
      revalidatePath(`/kds`, "page");
      revalidatePath(`/menu/${companyId}/my-orders`, "page");

      return { success: true, saleId: sale.id };
    } catch (error: unknown) {
      console.error("Convert Order to Sale Error:", error);
      const message = error instanceof Error ? error.message : "Falha ao converter pedido(s) em venda.";
      throw new Error(message);
    }
  });

"use server";

import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { revalidatePath } from "next/cache";
import { auth } from "@/app/_lib/auth";

const convertOrderToSaleSchema = z.object({
  orderId: z.string(),
  companyId: z.string(),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "PIX", "OTHER"]),
  tipAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  extraAmount: z.number().min(0).default(0),
  adjustmentReason: z.string().optional().nullable(),
  isEmployeeSale: z.boolean().default(false),
});

export const convertOrderToSaleAction = actionClient
  .schema(convertOrderToSaleSchema)
  .action(async ({ parsedInput: { orderId, companyId, paymentMethod, tipAmount, discountAmount, extraAmount, adjustmentReason, isEmployeeSale } }) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    try {
      const sale = await OrderService.convertToSale(
        orderId,
        companyId,
        session.user.id,
        paymentMethod,
        tipAmount,
        discountAmount,
        extraAmount,
        adjustmentReason || undefined,
        isEmployeeSale,
      );

      revalidatePath(`/sales`);
      revalidatePath(`/kds`);

      return { success: true, saleId: sale.id };
    } catch (error: any) {
      console.error("Convert Order to Sale Error:", error);
      throw new Error(error.message || "Falha ao converter pedido em venda.");
    }
  });

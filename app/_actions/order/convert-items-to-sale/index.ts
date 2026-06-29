"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { revalidatePath } from "next/cache";
import { auth } from "@/app/_lib/auth";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { PaymentMethod, SaleStatus } from "@prisma/client";
import { convertItemsToSaleSchema } from "./schema";

export const convertItemsToSaleAction = actionClient
  .schema(convertItemsToSaleSchema)
  .action(async ({ parsedInput: { itemIds, paymentMethod, tipAmount, discountAmount, extraAmount, adjustmentReason, isEmployeeSale, status, dueDate, customerId } }) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    const companyId = await getCurrentCompanyId();

    try {
      const sale = await OrderService.convertItemsToSale(
        itemIds,
        companyId,
        session.user.id,
        (paymentMethod as PaymentMethod) || null,
        tipAmount,
        discountAmount,
        extraAmount,
        adjustmentReason || "",
        isEmployeeSale,
        status as SaleStatus,
        dueDate,
        customerId,
      );

      revalidatePath(`/sales`, "page");
      revalidatePath(`/kds`, "page");
      revalidatePath(`/menu/${companyId}/my-orders`, "page");

      return { success: true, saleId: sale.id };
    } catch (error: unknown) {
      console.error("Convert Items to Sale Error:", error);
      const message = error instanceof Error ? error.message : "Falha ao processar pagamento parcial.";
      throw new Error(message);
    }
  });

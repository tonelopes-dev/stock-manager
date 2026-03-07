"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { OrderService } from "@/app/_services/order";
import { revalidatePath } from "next/cache";
import { auth } from "@/app/_lib/auth";
import { convertItemsToSaleSchema } from "./schema";

export const convertItemsToSaleAction = actionClient
  .schema(convertItemsToSaleSchema)
  .action(async ({ parsedInput: { itemIds, companyId, paymentMethod } }) => {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    try {
      const sale = await OrderService.convertItemsToSale(
        itemIds,
        companyId,
        session.user.id,
        paymentMethod,
      );

      revalidatePath(`/sales`);
      revalidatePath(`/kds`);

      return { success: true, saleId: sale.id };
    } catch (error: any) {
      console.error("Convert Items to Sale Error:", error);
      throw new Error(error.message || "Falha ao processar pagamento parcial.");
    }
  });

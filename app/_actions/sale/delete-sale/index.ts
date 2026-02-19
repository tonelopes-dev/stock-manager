"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { deleteSaleSchema } from "./schema";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { recordStockMovement } from "@/app/_lib/stock";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";

export const deleteSale = actionClient
  .schema(deleteSaleSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    const { userId } = await assertRole(ADMIN_AND_OWNER);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    await db.$transaction(async (trx) => {
      const sale = await trx.sale.findFirst({
        where: {
          id,
          companyId, // Ensure sale belongs to current company
        },
        include: {
          saleItems: true,
        },
      });
      if (!sale) return;
      for (const item of sale.saleItems) {
        await recordStockMovement(
          {
            productId: item.productId,
            companyId,
            userId,
            type: "CANCEL",
            quantity: Number(item.quantity),
            saleId: sale.id,
            reason: "Exclusão de venda",
          },
          trx
        );
      }

      await trx.sale.delete({
        where: { id },
      });
    });
    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/sales");
    revalidatePath("/products");
  });

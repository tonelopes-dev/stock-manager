"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { deleteSaleSchema } from "./schema";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const deleteSale = actionClient
  .schema(deleteSaleSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await db.$transaction(async (trx) => {
      const sale = await trx.sale.findFirst({
        where: {
          id,
          companyId, // Ensure sale belongs to current company
        },
        include: {
          saleProducts: true,
        },
      });
      if (!sale) return;
      await trx.sale.delete({
        where: {
          id,
        },
      });
      for (const product of sale.saleProducts) {
        await trx.product.update({
          where: {
            id: product.productId,
          },
          data: {
            stock: {
              increment: product.quantity,
            },
          },
        });
      }
    });
    revalidatePath("/", "layout");
  });

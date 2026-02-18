"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { cancelSaleSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { recordStockMovement } from "@/app/_lib/stock";
import { authorizeAction } from "@/app/_lib/rbac";
import { BusinessError } from "@/app/_lib/errors";

export const cancelSale = actionClient
  .schema(cancelSaleSchema)
  .action(async ({ parsedInput: { id } }) => {
    try {
      const companyId = await getCurrentCompanyId();
      await authorizeAction(["OWNER", "ADMIN"]);
      const session = await auth();
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("Usuário não autenticado.");
      }

      await db.$transaction(async (trx) => {
        const sale = await trx.sale.findFirst({
          where: { id, companyId },
          include: { saleItems: true },
        });

        if (!sale) {
          throw new Error("Venda não encontrada.");
        }

        if (sale.status === "CANCELED") {
          throw new Error("Esta venda já está cancelada.");
        }

        await trx.sale.update({
          where: { id },
          data: { status: "CANCELED" },
        });

        for (const item of sale.saleItems) {
          await recordStockMovement(
            {
              productId: item.productId,
              companyId,
              userId,
              type: "CANCEL",
              quantity: Number(item.quantity),
              saleId: sale.id,
              reason: "Cancelamento de venda",
            },
            trx
          );
        }
      });

      revalidatePath("/sales", "page");
      revalidatePath("/");
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      throw error;
    }
  });

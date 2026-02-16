"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { cancelSaleSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { recordStockMovement } from "@/app/_lib/stock";
import { authorizeAction } from "@/app/_lib/rbac";

export const cancelSale = actionClient
  .schema(cancelSaleSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await authorizeAction(["OWNER", "ADMIN"]);
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    await db.$transaction(async (trx) => {
      const sale = await trx.sale.findFirst({
        where: { id, companyId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        include: { saleItems: true } as any,
      });

      if (!sale) {
        throw new Error("Sale not found.");
      }

      if (sale.status === "CANCELED") {
        throw new Error("Sale is already canceled.");
      }

      await trx.sale.update({
        where: { id },
        data: { status: "CANCELED" },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const item of (sale as any).saleItems) {
        await recordStockMovement(
          {
            productId: item.productId,
            companyId,
            userId,
            type: "CANCEL",
            quantity: Number(item.quantity),
            saleId: sale.id,
            reason: "Sale cancellation",
          },
          trx
        );
      }
    });

    revalidatePath("/sales", "page");
    revalidatePath("/");
  });

"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { deleteSaleSchema } from "./schema";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { recordStockMovement } from "@/app/_lib/stock";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType, AuditSeverity } from "@prisma/client";


export const deleteSale = actionClient
  .schema(deleteSaleSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    const { userId } = await assertRole(ADMIN_AND_OWNER);


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

      // 3. Log Audit within transaction
      await AuditService.logWithTransaction(trx, {
        type: AuditEventType.SALE_DELETED,
        severity: AuditSeverity.WARNING,


        companyId,
        entityType: "SALE",
        entityId: id,
        metadata: {
          saleId: id,
          total: Number(sale.totalAmount),
        },
      });
    });

    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/sales");
    revalidatePath("/products");
  });

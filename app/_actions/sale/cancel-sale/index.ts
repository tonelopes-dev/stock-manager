"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { cancelSaleSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { recordStockMovement } from "@/app/_lib/stock";
import { assertRole, ADMIN_AND_OWNER } from "@/app/_lib/rbac";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType, AuditSeverity } from "@prisma/client";
import { BusinessError } from "@/app/_lib/errors";

export const cancelSale = actionClient
  .schema(cancelSaleSchema)
  .action(async ({ parsedInput: { id } }) => {
    try {
      const companyId = await getCurrentCompanyId();
      const { userId } = await assertRole(ADMIN_AND_OWNER);

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

        // Log Audit within transaction
        await AuditService.logWithTransaction(trx, {
          type: AuditEventType.SALE_CANCELED,
          severity: AuditSeverity.WARNING,
          companyId,
          entityType: "SALE",
          entityId: sale.id,
          metadata: {
            saleId: sale.id,
            total: Number(sale.totalAmount),
          },
        });
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

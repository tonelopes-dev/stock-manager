"use server";

import { settleReceivableSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { returnValidationErrors } from "next-safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType } from "@prisma/client";
import { db } from "@/app/_lib/prisma";

export const settleReceivableAction = actionClient
  .schema(settleReceivableSchema)
  .action(async ({ parsedInput: { saleId, paymentMethod } }) => {
    const companyId = await getCurrentCompanyId();
    
    // Apenas ADMIN e OWNER podem dar baixa em pagamentos
    const { userId } = await assertRole(ADMIN_AND_OWNER);
    
    await requireActiveSubscription(companyId);

    try {
      const sale = await db.$transaction(async (trx) => {
        const existingSale = await trx.sale.findUnique({
          where: { id: saleId, companyId },
          select: { id: true, status: true, totalAmount: true, tipAmount: true },
        });

        if (!existingSale) {
          throw new Error("Venda não encontrada.");
        }

        if (existingSale.status !== "PENDING_PAYMENT") {
          throw new Error("Esta venda não está com pagamento pendente.");
        }

        const updatedSale = await trx.sale.update({
          where: { id: saleId },
          data: {
            status: "ACTIVE",
            paymentMethod,
            updatedAt: new Date(),
          },
        });

        return updatedSale;
      });

      await AuditService.log({
        type: AuditEventType.SALE_UPDATED,
        companyId,
        entityType: "SALE",
        entityId: sale.id,
        metadata: {
          action: "SETTLE_RECEIVABLE",
          saleId: sale.id,
          paymentMethod,
          totalAmount: Number(sale.totalAmount),
          tipAmount: Number(sale.tipAmount),
          settledByUserId: userId,
        },
      });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro ao dar baixa no recebível.";
      returnValidationErrors(settleReceivableSchema, {
        _errors: [message],
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/receivables");
    revalidatePath("/sales");
    revalidatePath("/customers");
  });

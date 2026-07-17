"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ADMIN_AND_OWNER, ALL_ROLES, assertRole } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { AuditService } from "@/app/_services/audit";
import { SaleService } from "@/app/_services/sale";
import { AuditEventType } from "@prisma/client";
import { returnValidationErrors } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { upsertSaleSchema } from "./schema";



export const upsertSale = actionClient
  .schema(upsertSaleSchema)
  .action(async ({ parsedInput: { products, id, date, customerId, paymentMethod, tipAmount, discountAmount, extraAmount, adjustmentReason, isEmployeeSale, status, dueDate } }) => {
    const companyId = await getCurrentCompanyId();
    const isUpdate = Boolean(id);
    
    // Role Guard: Only OWNER/ADMIN can edit. Anyone can create.
    const { userId } = await (isUpdate ? assertRole(ADMIN_AND_OWNER) : assertRole(ALL_ROLES));
    
    await requireActiveSubscription(companyId);

    try {
      const sale = await SaleService.upsertSale({
        id,
        date,
        companyId,
        userId,
        customerId: customerId || undefined,
        paymentMethod: paymentMethod || undefined,
        tipAmount,
        discountAmount,
        extraAmount,
        adjustmentReason: adjustmentReason || undefined,
        isEmployeeSale,
        status,
        dueDate,
        products,
      });

      await AuditService.log({
        type: isUpdate ? AuditEventType.SALE_UPDATED : AuditEventType.SALE_CREATED,
        companyId,


        entityType: "SALE",
        entityId: sale.id,
        metadata: {
          saleId: sale.id,
          totalAmount: Number(sale.totalAmount),
          tipAmount: Number(sale.tipAmount),
          itemCount: products.length,
        },

      });

    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro ao processar a venda.";
      returnValidationErrors(upsertSaleSchema, {
        _errors: [message],
      });
    }


    revalidatePath("/dashboard");
    revalidatePath("/sales");
    revalidatePath("/cardapio");
    revalidatePath("/customers");
    revalidatePath("/estoque"); // Adicionado para garantir atualização de estoque na UI
  });


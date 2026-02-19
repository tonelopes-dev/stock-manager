"use server";

import { upsertSaleSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { returnValidationErrors } from "next-safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { SaleService } from "@/app/_services/sale";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { ADMIN_AND_OWNER, ALL_ROLES, assertRole } from "@/app/_lib/rbac";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType } from "@prisma/client";



export const upsertSale = actionClient
  .schema(upsertSaleSchema)
  .action(async ({ parsedInput: { products, id, date } }) => {
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
          itemCount: products.length,
        },

      });

    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro ao processar a venda.";
      returnValidationErrors(upsertSaleSchema, {
        _errors: [message],
      });
    }


    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/sales");
    revalidatePath("/products");
  });


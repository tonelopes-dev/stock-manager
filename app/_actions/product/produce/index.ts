"use server";

import { revalidatePath } from "next/cache";
import { produceProductSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ProductionService } from "@/app/_services/production";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { ALL_ROLES, assertRole } from "@/app/_lib/rbac";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType } from "@prisma/client";



export const produceProduct = actionClient
  .schema(produceProductSchema)
  .action(async ({ parsedInput: { productId, quantity } }) => {
    const companyId = await getCurrentCompanyId();
    await requireActiveSubscription(companyId);
    const { userId } = await assertRole(ALL_ROLES);


    const result = await ProductionService.produce({
      productId,
      quantity,
      companyId,
      userId,
    });

    // Log Audit after production
    await AuditService.log({
      type: AuditEventType.PRODUCT_CREATED, // PRODUCTION is like creating new items
      companyId,

      entityType: "PRODUCT",
      entityId: productId,
      metadata: {
        productId,
        quantity,
        totalCost: Number(result.totalCost),
        reason: "Produção de lote",
      },
    });


    revalidatePath(`/products/${productId}`, "page");
    revalidatePath("/products", "page");
    revalidatePath("/ingredients", "page");
    revalidatePath("/");

    return {
      totalCost: Number(result.totalCost),
      quantity: result.productionOrder.quantity,
    };
  });

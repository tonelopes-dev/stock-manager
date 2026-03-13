"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { adjustStockSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { recordStockMovement } from "@/app/_lib/stock";
import { assertRole, ADMIN_AND_OWNER } from "@/app/_lib/rbac";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType } from "@prisma/client";

export const adjustStock = actionClient
  .schema(adjustStockSchema)
  .action(async ({ parsedInput: { id, quantity, reason } }) => {
    const companyId = await getCurrentCompanyId();
    await requireActiveSubscription(companyId);
    const { userId } = await assertRole(ADMIN_AND_OWNER);

    await db.$transaction(async (trx) => {
      const movement = await recordStockMovement(
        {
          productId: id,
          companyId,
          userId,
          type: "ADJUSTMENT",
          quantity,
          reason,
        },
        trx
      );

      const product = await trx.product.findUniqueOrThrow({
        where: { id, companyId },
        select: { name: true, unit: true },
      });

      // Log Audit
      await AuditService.logWithTransaction(trx, {
        type: AuditEventType.STOCK_ADJUSTED,
        companyId,
        entityType: "PRODUCT",
        entityId: id,
        metadata: {
          productId: id,
          name: product.name,
          qty: quantity,
          unit: product.unit,
          before: Number(movement.stockBefore),
          after: Number(movement.stockAfter),
          reason,
        },
      });
    });

    revalidatePath("/products", "page");
    revalidatePath("/");
  });

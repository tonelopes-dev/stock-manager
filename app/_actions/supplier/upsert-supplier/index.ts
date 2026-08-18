"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { upsertSupplierSchema } from "./schema";

export const upsertSupplier = actionClient
  .schema(upsertSupplierSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    await assertActionCapability(PERMISSIONS.STOCK_ADJUST);

    const result = await db.supplier.upsert({
      where: {
        id: id || "",
      },
      update: {
        ...data,
      },
      create: {
        ...data,
        companyId,
      },
    });

    // Auditoria
    await AuditService.log({
      type: id ? AuditEventType.MEMBER_INVITED : AuditEventType.MEMBER_INVITED, // Usando MEMBER_INVITED temporariamente ou mapeando um novo tipo
      companyId,
      entityType: "SUPPLIER",
      entityId: result.id,
      metadata: {
        name: result.name,
      },
    });

    revalidatePath("/suppliers");
    
    return result;
  });

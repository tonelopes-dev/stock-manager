"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertSupplierSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType } from "@prisma/client";

export const upsertSupplier = actionClient
  .schema(upsertSupplierSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ADMIN_AND_OWNER);

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

"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { updateCustomerStageSchema } from "./schema";

export const updateCustomerStage = actionClient
  .schema(updateCustomerStageSchema)
  .action(async ({ parsedInput: { customerId, stageId } }) => {
    const companyId = await getCurrentCompanyId();

    const customer = await db.customer.findUnique({
      where: { id: customerId, companyId },
      include: { stage: true }
    });

    if (!customer) throw new Error("Cliente não encontrado.");

    const newStage = await db.cRMStage.findUnique({
      where: { id: stageId, companyId }
    });

    await db.customer.update({
      where: { id: customerId, companyId },
      data: { stageId },
    });

    const { AuditService } = await import("@/app/_services/audit");
    const { AuditEventType } = await import("@prisma/client");

    await AuditService.log({
      type: AuditEventType.CUSTOMER_STAGE_UPDATED,
      companyId,
      entityType: "CUSTOMER",
      entityId: customerId,
      metadata: {
        customerName: customer.name,
        fromStage: customer.stage?.name || "Sem funil",
        toStage: newStage?.name || "Sem funil",
        customerId,
      },
    });

    revalidatePath("/customers");
    revalidatePath("/journeys");
  });

"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { deleteCRMStageSchema } from "./schema";

export const deleteCRMStage = actionClient
  .schema(deleteCRMStageSchema)
  .action(async ({ parsedInput: { id, destinationId } }) => {
    const companyId = await getCurrentCompanyId();

    const customersCount = await db.customer.count({
      where: { stageId: id, companyId },
    });

    if (customersCount > 0 && !destinationId) {
      throw new Error("MIGRATION_REQUIRED");
    }

    await db.$transaction(async (tx) => {
      if (customersCount > 0 && destinationId) {
        await tx.customer.updateMany({
          where: { stageId: id, companyId },
          data: { stageId: destinationId },
        });
      }

      const stageToDelete = await tx.cRMStage.findUnique({
        where: { id, companyId },
      });

      if (!stageToDelete) return;

      await tx.cRMStage.delete({
        where: { id, companyId },
      });

      await tx.cRMStage.updateMany({
        where: {
          companyId,
          order: { gt: stageToDelete.order },
        },
        data: {
          order: { decrement: 1 },
        },
      });
    });

    revalidatePath("/customers");
  });

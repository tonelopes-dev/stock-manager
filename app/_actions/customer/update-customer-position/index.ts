"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { updateCustomerPositionSchema } from "./schema";

export const updateCustomerPosition = actionClient
  .schema(updateCustomerPositionSchema)
  .action(async ({ parsedInput: { customerId, newStageId, newPosition } }) => {
    const companyId = await getCurrentCompanyId();

    const customer = await db.customer.findUnique({
      where: { id: customerId, companyId },
    });

    if (!customer) {
      throw new Error("Cliente não encontrado.");
    }

    const oldStageId = customer.stageId;
    const oldPosition = customer.position;

    await db.$transaction(async (tx) => {
      if (oldStageId === newStageId) {
        // Move inside the same column
        if (oldPosition === newPosition) return;

        if (oldPosition < newPosition) {
          // Moving down: Shift others up
          await tx.customer.updateMany({
            where: {
              companyId,
              stageId: oldStageId,
              position: { gt: oldPosition, lte: newPosition },
            },
            data: { position: { decrement: 1 } },
          });
        } else {
          // Moving up: Shift others down
          await tx.customer.updateMany({
            where: {
              companyId,
              stageId: oldStageId,
              position: { lt: oldPosition, gte: newPosition },
            },
            data: { position: { increment: 1 } },
          });
        }
      } else {
        // Move between columns
        // 1. Close gap in the old column
        await tx.customer.updateMany({
          where: {
            companyId,
            stageId: oldStageId,
            position: { gt: oldPosition },
          },
          data: { position: { decrement: 1 } },
        });

        // 2. Open gap in the new column
        await tx.customer.updateMany({
          where: {
            companyId,
            stageId: newStageId,
            position: { gte: newPosition },
          },
          data: { position: { increment: 1 } },
        });
      }

      // 3. Update the customer itself
      await tx.customer.update({
        where: { id: customerId, companyId },
        data: {
          stageId: newStageId,
          position: newPosition,
        },
      });
    });

    revalidatePath("/customers");
  });

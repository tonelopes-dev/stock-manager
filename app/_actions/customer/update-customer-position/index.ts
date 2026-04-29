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
      const affectedStages =
        oldStageId === newStageId ? [oldStageId] : [oldStageId, newStageId];
      const stageIds = affectedStages.filter((s): s is string => !!s);

      // 1. Lock rows to prevent deadlocks (Row Level Locking)
      // Using raw query because Prisma findMany doesn't support FOR UPDATE natively in all versions/contexts easily
      if (stageIds.length > 0) {
        await tx.$executeRawUnsafe(
          `SELECT id FROM "Customer" WHERE "companyId" = $1 AND "stageId" IN (${stageIds.map((_, i) => `$${i + 2}`).join(",")}) FOR UPDATE`,
          companyId,
          ...stageIds
        );
      }

      // 2. Get all customers from affected columns
      const allAffectedCustomers = await tx.customer.findMany({
        where: {
          companyId,
          stageId: { in: stageIds },
        },
        orderBy: { position: "asc" },
      });

      // 3. Separate into columns
      const columns: Record<string, any[]> = {};
      affectedStages.forEach((s) => {
        if (s) columns[s] = [];
      });
      allAffectedCustomers.forEach((c) => {
        if (c.stageId && columns[c.stageId]) {
          columns[c.stageId].push(c);
        }
      });

      // 4. Apply the move in-memory
      if (oldStageId === newStageId) {
        const colId = oldStageId!;
        const items = columns[colId];
        const activeIdx = items.findIndex((c) => c.id === customerId);
        if (activeIdx !== -1) {
          const [movedItem] = items.splice(activeIdx, 1);
          items.splice(newPosition, 0, movedItem);
        }
      } else {
        // Remove from old
        if (oldStageId && columns[oldStageId]) {
          const oldIdx = columns[oldStageId].findIndex(
            (c) => c.id === customerId,
          );
          if (oldIdx !== -1) {
            columns[oldStageId].splice(oldIdx, 1);
          }
        }
        // Add to new
        if (newStageId && columns[newStageId]) {
          const activeCust = allAffectedCustomers.find(
            (c) => c.id === customerId,
          );
          if (activeCust) {
            const updatedCust = { ...activeCust, stageId: newStageId };
            columns[newStageId].splice(newPosition, 0, updatedCust);
          }
        }
      }

      // 5. Persist all changes sequentially to avoid race conditions and deadlocks
      for (const stageId of affectedStages) {
        if (!stageId || !columns[stageId]) continue;
        const items = columns[stageId];
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          // Only update if position or stageId changed (simple optimization)
          if (item.position !== i || item.stageId !== stageId) {
            await tx.customer.update({
              where: { id: item.id },
              data: {
                stageId,
                position: i,
              },
            });
          }
        }
      }
    });

    revalidatePath("/customers");
  });

"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { upsertCRMStageSchema } from "./schema";

export const upsertCRMStage = actionClient
  .schema(upsertCRMStageSchema)
  .action(async ({ parsedInput: { id, name } }) => {
    const companyId = await getCurrentCompanyId();

    if (id) {
      await db.cRMStage.update({
        where: { id, companyId },
        data: { name },
      });
    } else {
      // Get highest order to append at the end
      const lastStage = await db.cRMStage.findFirst({
        where: { companyId },
        orderBy: { order: "desc" },
      });

      await db.cRMStage.create({
        data: {
          name,
          companyId,
          order: lastStage ? lastStage.order + 1 : 0,
        },
      });
    }

    revalidatePath("/customers");
  });

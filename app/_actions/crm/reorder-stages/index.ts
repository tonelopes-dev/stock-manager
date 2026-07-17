"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { reorderCRMStagesSchema } from "./schema";

export const reorderCRMStages = actionClient
  .schema(reorderCRMStagesSchema)
  .action(async ({ parsedInput: { stageIds } }) => {
    const companyId = await getCurrentCompanyId();

    await db.$transaction(
      stageIds.map((id, index) =>
        db.cRMStage.update({
          where: { id, companyId },
          data: { order: index },
        })
      )
    );

    revalidatePath("/customers");
  });

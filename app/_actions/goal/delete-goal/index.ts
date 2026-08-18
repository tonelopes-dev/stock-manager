"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const deleteGoalSchema = z.object({
  id: z.string(),
});

export const deleteGoal = actionClient
  .schema(deleteGoalSchema)
  .action(async ({ parsedInput: { id } }) => {
    await assertActionCapability(PERMISSIONS.COMPANY_SETTINGS_UPDATE);
    const companyId = await getCurrentCompanyId();

    await db.goal.delete({
      where: { id, companyId },
    });

    revalidatePath("/goals");
    revalidatePath("/"); // Dashboard
  });

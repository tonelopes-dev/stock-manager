"use server";

import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";

const deleteGoalSchema = z.object({
  id: z.string(),
});

export const deleteGoal = actionClient
  .schema(deleteGoalSchema)
  .action(async ({ parsedInput: { id } }) => {
    await assertRole(ADMIN_AND_OWNER);
    const companyId = await getCurrentCompanyId();

    await db.goal.delete({
      where: { id, companyId },
    });

    revalidatePath("/goals");
    revalidatePath("/"); // Dashboard
  });

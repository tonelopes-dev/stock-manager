"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

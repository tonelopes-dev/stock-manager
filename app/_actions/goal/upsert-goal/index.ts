"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { upsertGoalSchema } from "./schema";

export const upsertGoal = actionClient
  .schema(upsertGoalSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    const { userId } = await assertRole(ADMIN_AND_OWNER);
    const companyId = await getCurrentCompanyId();

    const goalData = {
      ...data,
      targetValue: new Prisma.Decimal(data.targetValue as number),
      endDate: data.endDate || null,
      productId: data.productId || null,
      description: data.description || null,
    };

    if (id) {
      await db.goal.update({
        where: { id, companyId },
        data: goalData,
      });
    } else {
      await db.goal.create({
        data: {
          ...goalData,
          companyId,
          createdById: userId,
        },
      });
    }

    revalidatePath("/goals");
    revalidatePath("/"); // Dashboard
  });

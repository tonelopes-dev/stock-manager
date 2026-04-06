"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertFixedExpenseSchema, deleteFixedExpenseSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, OWNER_ONLY, ADMIN_AND_OWNER } from "@/app/_lib/rbac";

export const upsertFixedExpense = actionClient
  .schema(upsertFixedExpenseSchema)
  .action(async ({ parsedInput: { id, name, value } }) => {
    const companyId = await getCurrentCompanyId();
    const { userId } = await assertRole(ADMIN_AND_OWNER);

    if (id) {
      await db.fixedExpense.update({
        where: { id, companyId },
        data: { name, value },
      });
    } else {
      await db.fixedExpense.create({
        data: {
          name,
          value,
          companyId,
        },
      });
    }

    revalidatePath("/settings/company");
    return { success: true };
  });

export const deleteFixedExpense = actionClient
  .schema(deleteFixedExpenseSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    const { userId } = await assertRole(ADMIN_AND_OWNER);

    await db.fixedExpense.delete({
      where: { id, companyId },
    });

    revalidatePath("/settings/company");
    return { success: true };
  });

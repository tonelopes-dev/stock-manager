"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { deleteFixedExpenseSchema, upsertFixedExpenseSchema } from "./schema";

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

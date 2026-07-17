"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { ALL_ROLES, assertRole } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  id: z.string(),
  birthdayReminderDate: z.date().nullable(),
});

export const updateCustomerBirthdayReminder = actionClient
  .schema(schema)
  .action(async ({ parsedInput: { id, birthdayReminderDate } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);

    await db.customer.update({
      where: { id, companyId },
      data: { birthdayReminderDate },
    });

    revalidatePath("/customers");
  });

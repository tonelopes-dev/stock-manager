"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
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
    await assertActionCapability(PERMISSIONS.CUSTOMER_MANAGE);

    await db.customer.update({
      where: { id, companyId },
      data: { birthdayReminderDate },
    });

    revalidatePath("/customers");
  });

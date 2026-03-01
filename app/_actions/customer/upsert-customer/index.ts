"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertCustomerSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { ALL_ROLES, assertRole } from "@/app/_lib/rbac";

export const upsertCustomer = actionClient
  .schema(upsertCustomerSchema)
  .action(async ({ parsedInput: { id, birthday, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);
    await requireActiveSubscription(companyId);

    const customerData = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      category: data.category,
      notes: data.notes || null,
      birthday: birthday ? new Date(birthday) : null,
    };

    if (id) {
      await db.customer.update({
        where: { id, companyId },
        data: customerData,
      });
    } else {
      await db.customer.create({
        data: {
          ...customerData,
          companyId,
        },
      });
    }

    revalidatePath("/customers", "page");
  });

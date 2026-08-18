"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { upsertCustomerCategorySchema } from "./schema";

export const upsertCustomerCategory = actionClient
  .schema(upsertCustomerCategorySchema)
  .action(async ({ parsedInput: { id, name } }) => {
    const companyId = await getCurrentCompanyId();
    await assertActionCapability(PERMISSIONS.CUSTOMER_MANAGE);

    const result = id
      ? await db.customerCategory.update({
          where: { id, companyId },
          data: { name },
        })
      : await db.customerCategory.create({
          data: { name, companyId },
        });

    revalidatePath("/customers");
    return result;
  });

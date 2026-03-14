"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertCategorySchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";

export const upsertCategory = actionClient
  .schema(upsertCategorySchema)
  .action(async ({ parsedInput: { id, name } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ADMIN_AND_OWNER);

    if (id) {
      await db.category.update({
        where: { id, companyId },
        data: { name },
      });
    } else {
      await db.category.create({
        data: {
          name,
          companyId,
        },
      });
    }

    revalidatePath("/products");
  });

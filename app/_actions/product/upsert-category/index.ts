"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { upsertCategorySchema } from "./schema";

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

    revalidatePath("/cardapio");
  });

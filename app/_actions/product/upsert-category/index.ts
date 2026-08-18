"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { upsertCategorySchema } from "./schema";

export const upsertCategory = actionClient
  .schema(upsertCategorySchema)
  .action(async ({ parsedInput: { id, name } }) => {
    const companyId = await getCurrentCompanyId();
    await assertActionCapability(PERMISSIONS.PRODUCT_UPDATE);

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

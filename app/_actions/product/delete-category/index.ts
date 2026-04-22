"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";

const deleteCategorySchema = z.object({
  id: z.string().cuid(),
  destinationId: z.string().cuid().optional(),
});

export const deleteCategory = actionClient
  .schema(deleteCategorySchema)
  .action(async ({ parsedInput: { id, destinationId } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ADMIN_AND_OWNER);

    // Check if there are products in this category
    const productsCount = await db.product.count({
      where: { categoryId: id, companyId },
    });

    if (productsCount > 0 && !destinationId) {
      throw new Error("MIGRATION_REQUIRED");
    }

    await db.$transaction(async (tx) => {
      if (productsCount > 0 && destinationId) {
        await tx.product.updateMany({
          where: { categoryId: id, companyId },
          data: { categoryId: destinationId },
        });
      }

      await tx.category.delete({
        where: { id, companyId },
      });
    });

    revalidatePath("/cardapio");
  });

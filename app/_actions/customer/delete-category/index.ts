"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { deleteCustomerCategorySchema } from "./schema";

export const deleteCustomerCategory = actionClient
  .schema(deleteCustomerCategorySchema)
  .action(async ({ parsedInput: { id, destinationId } }) => {
    const companyId = await getCurrentCompanyId();

    const customersCount = await db.customer.count({
      where: { categoryId: id, companyId },
    });

    if (customersCount > 0 && !destinationId) {
      throw new Error("MIGRATION_REQUIRED");
    }

    await db.$transaction(async (tx) => {
      if (customersCount > 0 && destinationId) {
        await tx.customer.updateMany({
          where: { categoryId: id, companyId },
          data: { categoryId: destinationId },
        });
      }

      await tx.customerCategory.delete({
        where: { id, companyId },
      });
    });

    revalidatePath("/customers");
  });

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
      where: { categories: { some: { id } }, companyId },
    });

    if (customersCount > 0 && !destinationId) {
      throw new Error("MIGRATION_REQUIRED");
    }

    await db.$transaction(async (tx) => {
      if (customersCount > 0 && destinationId) {
        const customersToMigrate = await tx.customer.findMany({
          where: { categories: { some: { id } }, companyId },
          select: { id: true },
        });

        for (const customer of customersToMigrate) {
          await tx.customer.update({
            where: { id: customer.id },
            data: {
              categories: {
                disconnect: { id },
                connect: { id: destinationId },
              },
            },
          });
        }
      }

      await tx.customerCategory.delete({
        where: { id, companyId },
      });
    });

    revalidatePath("/customers");
  });

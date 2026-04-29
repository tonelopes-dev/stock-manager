"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { z } from "zod";
import { deleteOldImage } from "@/app/_lib/storage";

const deleteCustomerSchema = z.object({
  id: z.string().cuid(),
});

export const deleteCustomer = actionClient
  .schema(deleteCustomerSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ADMIN_AND_OWNER);

    // Verify customer belongs to this company and get imageUrl
    const customer = await db.customer.findFirst({
      where: { id, companyId },
      select: { id: true, stageId: true, position: true, imageUrl: true }
    });

    if (!customer) {
      throw new Error("Cliente não encontrado.");
    }

    await db.$transaction(async (tx) => {
      // 1. Adjust positions in the same column
      await tx.customer.updateMany({
        where: {
          companyId,
          stageId: customer.stageId,
          position: { gt: customer.position },
        },
        data: { position: { decrement: 1 } },
      });

      // 2. Delete the customer
      await tx.customer.delete({
        where: { id, companyId },
      });
    });

    // 3. Cleanup old image AFTER successful transaction
    if (customer.imageUrl) {
      await deleteOldImage(customer.imageUrl);
    }

    revalidatePath("/customers", "page");
  });

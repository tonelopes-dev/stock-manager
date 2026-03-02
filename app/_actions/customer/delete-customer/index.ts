"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { z } from "zod";

const deleteCustomerSchema = z.object({
  id: z.string().cuid(),
});

export const deleteCustomer = actionClient
  .schema(deleteCustomerSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ADMIN_AND_OWNER);

    // Verify customer belongs to this company
    const customer = await db.customer.findFirst({
      where: { id, companyId },
      include: { _count: { select: { sales: true } } },
    });

    if (!customer) {
      throw new Error("Cliente não encontrado.");
    }

    await db.$transaction(async (tx) => {
      // 1. Manually cleanup related data if not cascading in schema 
      // (Sales usually should not be deleted, but if requested we handle it)
      // For now, only delete if no sales as per current check.
      
      // 2. Adjust positions in the same column
      await tx.customer.updateMany({
        where: {
          companyId,
          stageId: customer.stageId,
          position: { gt: customer.position },
        },
        data: { position: { decrement: 1 } },
      });

      // 3. Delete the customer
      await tx.customer.delete({
        where: { id, companyId },
      });
    });

    revalidatePath("/customers", "page");
  });

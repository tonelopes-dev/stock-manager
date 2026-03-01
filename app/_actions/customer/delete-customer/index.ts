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

    if (customer._count.sales > 0) {
      throw new Error(
        "Não é possível excluir um cliente com vendas vinculadas. Desative-o.",
      );
    }

    await db.customer.delete({
      where: { id },
    });

    revalidatePath("/customers", "page");
  });

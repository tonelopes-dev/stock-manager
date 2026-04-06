"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { revalidatePath } from "next/cache";

const schema = z.object({
  newRate: z.number().min(0),
});

export const bulkUpdateOperationalCosts = actionClient
  .schema(schema)
  .action(async ({ parsedInput: { newRate } }) => {
    const companyId = await getCurrentCompanyId();
    
    // RBAC: Only Admin/Owner can perform bulk updates
    await assertRole(ADMIN_AND_OWNER);

    const result = await db.product.updateMany({
      where: {
        companyId,
      },
      data: {
        operationalCost: newRate,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/products");

    return { count: result.count };
  });

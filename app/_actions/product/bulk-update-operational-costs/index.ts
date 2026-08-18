"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  newRate: z.number().min(0),
});

export const bulkUpdateOperationalCosts = actionClient
  .schema(schema)
  .action(async ({ parsedInput: { newRate } }) => {
    const companyId = await getCurrentCompanyId();
    
    // RBAC: requer capability PRODUCT_UPDATE (OWNER tem bypass automático)
    await assertActionCapability(PERMISSIONS.PRODUCT_UPDATE);

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
    revalidatePath("/cardapio");

    return { count: result.count };
  });

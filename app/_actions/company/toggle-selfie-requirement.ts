"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, OWNER_ONLY } from "@/app/_lib/rbac";

const toggleSelfieSchema = z.object({
  enabled: z.boolean(),
});

export const toggleSelfieRequirement = actionClient
  .schema(toggleSelfieSchema)
  .action(async ({ parsedInput: { enabled } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(OWNER_ONLY);

    await db.company.update({
      where: { id: companyId },
      data: {
        requireSelfieOnCheckout: enabled,
      },
    });

    revalidatePath("/menu-management");
    revalidatePath(`/menu/${companyId}`);
    
    return { success: true };
  });

"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { toggleIntegrationSchema } from "./schema";
import { db } from "@/app/_lib/prisma";
import { assertRole } from "@/app/_lib/rbac";
import { revalidatePath } from "next/cache";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const toggleIntegration = actionClient
  .schema(toggleIntegrationSchema)
  .action(async ({ parsedInput: { id, companyId, isEnabled } }) => {
    // 1. Autorização
    await assertRole(["OWNER", "ADMIN"]);
    
    const currentCompanyId = await getCurrentCompanyId();
    if (currentCompanyId !== companyId) {
      throw new Error("Unauthorized tenant access");
    }

    // 2. Atualiza estado
    await db.companyIntegration.update({
      where: { id, companyId },
      data: { isEnabled },
    });

    revalidatePath("/integracoes");
    return { success: true };
  });

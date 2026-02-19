"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { updateCompanySchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, OWNER_ONLY } from "@/app/_lib/rbac";

export const updateCompany = actionClient
  .schema(updateCompanySchema)
  .action(async ({ parsedInput: { name, allowNegativeStock } }) => {
    const companyId = await getCurrentCompanyId();
    
    // Layer 2: Action Guard
    await assertRole(OWNER_ONLY);

    await db.company.update({
      where: { id: companyId },
      data: {
        name,
        allowNegativeStock,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/settings/company"); // Future page
    
    return { success: true };
  });

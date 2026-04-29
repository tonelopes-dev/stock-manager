"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, OWNER_ONLY } from "@/app/_lib/rbac";

const updateSlugSchema = z.object({
  slug: z.string()
    .min(3, "O slug deve ter pelo menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hífens"),
});

export const updateCompanySlug = actionClient
  .schema(updateSlugSchema)
  .action(async ({ parsedInput: { slug } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(OWNER_ONLY);

    // Verificar unicidade
    const existingCompany = await db.company.findFirst({
      where: {
        slug,
        NOT: { id: companyId }
      }
    });

    if (existingCompany) {
      throw new Error("Este slug já está em uso por outra empresa.");
    }

    await db.company.update({
      where: { id: companyId },
      data: { slug },
    });

    revalidatePath("/", "layout");
    revalidatePath("/menu-management");
    
    return { success: true };
  });

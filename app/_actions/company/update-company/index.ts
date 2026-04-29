"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { updateCompanySchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, OWNER_ONLY } from "@/app/_lib/rbac";

export const updateCompany = actionClient
  .schema(updateCompanySchema)
  .action(async ({ parsedInput: { 
    slug,
    name, 
    allowNegativeStock, 
    estimatedMonthlyVolume, 
    enableOverheadInjection,
    bannerUrl,
    logoUrl,
    address,
    description,
    whatsappNumber,
    instagramUrl,
    operatingHours
  } }) => {
    const companyId = await getCurrentCompanyId();
    
    // Layer 2: Action Guard
    await assertRole(OWNER_ONLY);

    // Check slug uniqueness if changed
    if (slug) {
      const existingCompany = await db.company.findFirst({
        where: {
          slug,
          NOT: { id: companyId }
        }
      });

      if (existingCompany) {
        throw new Error("Este slug já está em uso por outra empresa.");
      }
    }

    await db.company.update({
      where: { id: companyId },
      data: {
        slug,
        name,
        allowNegativeStock,
        estimatedMonthlyVolume,
        enableOverheadInjection,
        bannerUrl,
        logoUrl,
        address,
        description,
        whatsappNumber,
        instagramUrl,
        operatingHours: operatingHours as any,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/menu-management");
    revalidatePath(`/menu/${companyId}`);
    
    return { success: true };
  });

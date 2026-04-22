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
    console.log("UPDATING COMPANY WITH:", { bannerUrl, logoUrl });
    const companyId = await getCurrentCompanyId();
    
    // Layer 2: Action Guard
    await assertRole(OWNER_ONLY);

    await db.company.update({
      where: { id: companyId },
      data: {
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

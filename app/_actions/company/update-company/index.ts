"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { updateCompanySchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, OWNER_ONLY } from "@/app/_lib/rbac";
import { deleteOldImage } from "@/app/_lib/storage";

export const updateCompany = actionClient
  .schema(updateCompanySchema)
  .action(async ({ parsedInput: { 
    slug,
    name, 
    allowNegativeStock, 
    estimatedMonthlyVolume, 
    enableOverheadInjection,
    enableServiceTax,
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

    // Fetch current urls for cleanup
    const currentCompany = await db.company.findUnique({
      where: { id: companyId },
      select: { logoUrl: true, bannerUrl: true }
    });

    let oldLogoUrl: string | null = null;
    let oldBannerUrl: string | null = null;

    if (currentCompany) {
      if (logoUrl !== undefined && logoUrl !== currentCompany.logoUrl) {
        oldLogoUrl = currentCompany.logoUrl;
      }
      if (bannerUrl !== undefined && bannerUrl !== currentCompany.bannerUrl) {
        oldBannerUrl = currentCompany.bannerUrl;
      }
    }

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
        enableServiceTax,
        bannerUrl,
        logoUrl,
        address,
        description,
        whatsappNumber,
        instagramUrl,
        operatingHours: operatingHours as any,
      },
    });

    if (oldLogoUrl) {
      await deleteOldImage(oldLogoUrl, logoUrl);
    }
    if (oldBannerUrl) {
      await deleteOldImage(oldBannerUrl, bannerUrl);
    }

    revalidatePath("/", "layout");
    revalidatePath("/menu-management");
    revalidatePath(`/menu/${companyId}`);
    
    return { success: true };
  });

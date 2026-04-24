"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { updateProductPromotionSchema } from "./schema";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const updateProductPromotion = actionClient
  .schema(updateProductPromotionSchema)
  .action(async ({ parsedInput: { productId, promoActive, promoPrice, promoSchedule } }) => {
    const companyId = await getCurrentCompanyId();

    await db.product.update({
      where: { 
        id: productId,
        companyId: companyId // Segurança: Garante que o produto pertence à empresa logada
      },
      data: {
        promoActive,
        promoPrice,
        promoSchedule: promoSchedule as any,
      },
    });

    revalidatePath("/menu-management");
    revalidatePath("/[companySlug]", "layout");
    
    return { success: true };
  });

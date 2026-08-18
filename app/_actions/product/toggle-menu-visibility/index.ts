"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const toggleMenuVisibilitySchema = z.object({
  productId: z.string(),
});

export const toggleMenuVisibility = actionClient
  .schema(toggleMenuVisibilitySchema)
  .action(async ({ parsedInput: { productId } }) => {
    const companyId = await getCurrentCompanyId();
    await assertActionCapability(PERMISSIONS.PRODUCT_UPDATE);

    const product = await db.product.findFirst({
      where: { id: productId, companyId },
      select: { isVisibleOnMenu: true },
    });

    if (!product) throw new Error("Produto não encontrado.");

    await db.product.update({
      where: { id: productId },
      data: { isVisibleOnMenu: !product.isVisibleOnMenu },
    });

    revalidatePath("/menu-management");
  });

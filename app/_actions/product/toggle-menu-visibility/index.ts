"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";

const toggleMenuVisibilitySchema = z.object({
  productId: z.string(),
});

export const toggleMenuVisibility = actionClient
  .schema(toggleMenuVisibilitySchema)
  .action(async ({ parsedInput: { productId } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ADMIN_AND_OWNER);

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

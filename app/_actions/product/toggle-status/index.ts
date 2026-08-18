"use server";

import { BusinessError } from "@/app/_lib/errors";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { toggleProductStatusSchema } from "./schema";

export const toggleProductStatus = actionClient
  .schema(toggleProductStatusSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await assertActionCapability(PERMISSIONS.PRODUCT_UPDATE);


    const product = await db.product.findFirst({
      where: { id, companyId },
    });

    if (!product) {
      throw new BusinessError("Produto não encontrado.");
    }

    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        isActive: !product.isActive,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/sales");
    revalidatePath("/cardapio");
    revalidatePath(`/cardapio/${id}`);

    return {
      success: true,
      isActive: updatedProduct.isActive,
    };
  });

"use server";

import { db } from "@/app/_lib/prisma";
import { toggleProductStatusSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { authorizeAction } from "@/app/_lib/rbac";
import { BusinessError } from "@/app/_lib/errors";

export const toggleProductStatus = actionClient
  .schema(toggleProductStatusSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await authorizeAction(["OWNER", "ADMIN"]);

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
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);

    return {
      success: true,
      isActive: updatedProduct.isActive,
    };
  });

"use server";

import { db } from "@/app/_lib/prisma";
import { deleteProductSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { authorizeAction } from "@/app/_lib/rbac";

export const deleteProduct = actionClient
  .schema(deleteProductSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await authorizeAction(companyId, ["OWNER", "ADMIN"]);

    // Verify ownership first because delete() requires a unique identifier
    const product = await db.product.findFirst({
      where: { id, companyId },
    });
    if (!product) return;
    await db.product.delete({
      where: {
        id,
      },
    });
    revalidatePath("/", "layout");
  });

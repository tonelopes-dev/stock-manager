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
    await authorizeAction(["OWNER", "ADMIN"]);

    // Verify ownership and check for sales history
    const product = await db.product.findFirst({
      where: { id, companyId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      include: {
        _count: {
          select: { saleItems: true }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    });

    if (!product) {
      throw new Error("Produto não encontrado.");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((product as any)._count.saleItems > 0) {
      throw new Error("Este produto possui histórico de vendas e não pode ser excluído. Recomendamos desativá-lo.");
    }

    await db.product.update({
      where: { id },
      data: { isActive: false }
    });
    revalidatePath("/", "layout");
  });

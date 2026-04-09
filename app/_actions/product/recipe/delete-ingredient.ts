"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { deleteRecipeIngredientSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { recalculateProductCostRecursive } from "./recalculate-cost";

export const deleteRecipeIngredient = actionClient
  .schema(deleteRecipeIngredientSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();

    const composition = await db.productComposition.findFirst({
      where: { id },
      include: { parent: true },
    });

    if (!composition || composition.parent.companyId !== companyId) {
      throw new Error("Registro de composição não encontrado.");
    }

    const { parentId } = composition;

    await db.productComposition.delete({
      where: { id },
    });

    // Recalculate cost recursively up the tree
    await recalculateProductCostRecursive(parentId);

    revalidatePath(`/cardapio/${parentId}`, "page");
    revalidatePath("/cardapio", "page");
    revalidatePath("/");
  });

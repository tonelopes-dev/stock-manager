"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { updateRecipeIngredientSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { isUnitCompatible } from "@/app/_lib/units";
import { UnitType } from "@prisma/client";
import { recalculateProductCostRecursive } from "./recalculate-cost";

export const updateRecipeIngredient = actionClient
  .schema(updateRecipeIngredientSchema)
  .action(async ({ parsedInput: { id, quantity, unit } }) => {
    const companyId = await getCurrentCompanyId();

    const composition = await db.productComposition.findFirst({
      where: { id },
      include: { parent: true, child: true },
    });

    if (!composition || composition.parent.companyId !== companyId) {
      throw new Error("Registro de composição não encontrado.");
    }

    // Check unit compatibility (using child's base unit)
    if (!isUnitCompatible(unit as UnitType, composition.child.unit)) {
      throw new Error(
        `Unidade incompatível: O item ${composition.child.name} é estocado em ${composition.child.unit} e não pode ser usado como ${unit}.`
      );
    }

    await db.productComposition.update({
      where: { id },
      data: { quantity },
    });

    // Recalculate cost recursively up the tree
    await recalculateProductCostRecursive(composition.parentId);

    revalidatePath(`/products/${composition.parentId}`, "page");
    revalidatePath("/products", "page");
    revalidatePath("/");
  });

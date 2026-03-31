"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { addRecipeIngredientSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { isUnitCompatible } from "@/app/_lib/units";
import { recalculateProductCostRecursive } from "./recalculate-cost";
import { ProductType, UnitType } from "@prisma/client";

export const addRecipeIngredient = actionClient
  .schema(addRecipeIngredientSchema)
  .action(async ({ parsedInput: { productId, ingredientId, quantity, unit } }) => {
    const companyId = await getCurrentCompanyId();

    // Loop prevention
    if (productId === ingredientId) {
      throw new Error("Um produto não pode ser ingrediente de si mesmo.");
    }

    // Validate product exists, belongs to company, and is PRODUCAO_PROPRIA or COMBO
    const product = await db.product.findFirst({
      where: { id: productId, companyId, isActive: true },
    });

    if (!product) {
      throw new Error("Produto não encontrado.");
    }

    const isCompositionAllowed = 
      product.type === ProductType.PRODUCAO_PROPRIA || 
      product.type === ProductType.COMBO;

    if (!isCompositionAllowed) {
      throw new Error("Apenas produtos de Produção Própria ou Combos podem ter composição.");
    }

    // Validate child product (ingredient)
    const child = await db.product.findFirst({
      where: { id: ingredientId, companyId, isActive: true },
    });

    if (!child) {
      throw new Error("Item a ser adicionado não encontrado.");
    }

    if (child.type === ProductType.COMBO) {
      throw new Error("Combos não podem fazer parte de uma ficha técnica para evitar loops infinitos.");
    }

    // Check unit compatibility (assuming composition quantity unit matches child's natural unit)
    if (!isUnitCompatible(unit as UnitType, child.unit)) {
      throw new Error(
        `Unidade incompatível: O item ${child.name} é estocado em ${child.unit} e não pode ser usado como ${unit}.`
      );
    }

    // Check for duplicate
    const existing = await db.productComposition.findUnique({
      where: {
        parentId_childId: { parentId: productId, childId: ingredientId },
      },
    });

    if (existing) {
      throw new Error("Este item já está na composição. Edite a quantidade existente.");
    }

    await db.productComposition.create({
      data: {
        parentId: productId,
        childId: ingredientId,
        quantity,
      },
    });

    // Recalculate cost recursively up the tree
    await recalculateProductCostRecursive(productId);

    revalidatePath(`/products/${productId}`, "page");
    revalidatePath("/products", "page");
    revalidatePath("/");
  });

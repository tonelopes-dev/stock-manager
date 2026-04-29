"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { addRecipeIngredientSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { isUnitCompatible, calculateStockDeduction } from "@/app/_lib/units";
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

    // Note: Deep circularity check is handled by the recursive logic or user responsibility 
    // for now. Direct circularity is checked at line 18.

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

    // Normalize quantity to the child's base unit before saving
    // Example: If user sends 100g and child is in KG, we save 0.1
    const normalizedQuantity = calculateStockDeduction(quantity, unit as UnitType, child.unit);

    await db.productComposition.create({
      data: {
        parentId: productId,
        childId: ingredientId,
        quantity: normalizedQuantity,
      },
    });

    // Recalculate cost recursively up the tree
    await recalculateProductCostRecursive(productId);

    revalidatePath(`/cardapio/${productId}`, "page");
    revalidatePath("/cardapio", "page");
    revalidatePath("/estoque", "page");
    revalidatePath("/");
  });

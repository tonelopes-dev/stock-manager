"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { addRecipeIngredientSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const addRecipeIngredient = actionClient
  .schema(addRecipeIngredientSchema)
  .action(async ({ parsedInput: { productId, ingredientId, quantity, unit } }) => {
    const companyId = await getCurrentCompanyId();

    // Validate product exists, belongs to company, and is PREPARED
    const product = await db.product.findFirst({
      where: { id: productId, companyId, isActive: true },
    });

    if (!product) {
      throw new Error("Produto não encontrado.");
    }

    if (product.type !== "PREPARED") {
      throw new Error("Apenas produtos do tipo Produção Própria podem ter receita.");
    }

    // Validate ingredient exists and belongs to company
    const ingredient = await db.ingredient.findFirst({
      where: { id: ingredientId, companyId, isActive: true },
    });

    if (!ingredient) {
      throw new Error("Insumo não encontrado.");
    }

    // Check for duplicate (@@unique constraint)
    const existing = await db.productRecipe.findUnique({
      where: {
        productId_ingredientId: { productId, ingredientId },
      },
    });

    if (existing) {
      throw new Error("Este insumo já está na receita. Edite a quantidade existente.");
    }

    await db.productRecipe.create({
      data: {
        productId,
        ingredientId,
        quantity,
        unit,
      },
    });

    revalidatePath(`/products/${productId}`, "page");
  });

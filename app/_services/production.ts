import { db } from "@/app/_lib/prisma";
import { recordStockMovement } from "@/app/_lib/stock";
import { calculateStockDeduction, calculateRealCost } from "@/app/_lib/units";
import { BusinessError } from "@/app/_lib/errors";
import * as Sentry from "@sentry/nextjs";
import { Prisma, UnitType } from "@prisma/client";

const Decimal = Prisma.Decimal;

interface ProduceParams {
  productId: string;
  quantity: number;
  companyId: string;
  userId: string;
}

interface IngredientConsumption {
  ingredientId: string;
  ingredientName: string;
  recipeQty: Prisma.Decimal;
  recipeUnit: UnitType;
  stockUnit: UnitType;
  deductionInStockUnit: Prisma.Decimal;
  costContribution: Prisma.Decimal;
  currentStock: Prisma.Decimal;
}

export const ProductionService = {
  /**
   * Produces a batch of a PREPARED product.
   * 1. Validates product, recipe, and ingredient stock (BEFORE transaction)
   * 2. Inside a single transaction: deducts ingredients, increments product stock,
   *    creates StockMovements, creates ProductionOrder
   */
  async produce({ productId, quantity, companyId, userId }: ProduceParams) {
    try {
      // ========================================
      // 1. PRE-VALIDATION (before transaction)
      // ========================================

      if (quantity <= 0) {
        throw new BusinessError("A quantidade deve ser maior que zero.");
      }

      const product = await db.product.findFirst({
        where: { id: productId, companyId, isActive: true },
      });

      if (!product) {
        throw new BusinessError("Produto não encontrado.");
      }

      if (product.type !== "PREPARED") {
        throw new BusinessError("Apenas produtos do tipo Produção Própria podem ser produzidos.");
      }

      const recipes = await db.productRecipe.findMany({
        where: { productId },
        include: { ingredient: true },
      });

      if (recipes.length === 0) {
        throw new BusinessError("Este produto não possui receita cadastrada. Adicione ingredientes antes de produzir.");
      }

      // ========================================
      // 2. CALCULATE CONSUMPTION & VALIDATE STOCK
      // ========================================

      const consumptions: IngredientConsumption[] = [];
      let totalCost = new Decimal(0);

      for (const rawRecipe of recipes) {
        const recipeUnit = rawRecipe.unit as UnitType;
        const ingredientUnit = rawRecipe.ingredient.unit as UnitType;

        // Total recipe qty = recipe.quantity × production quantity
        const totalRecipeQty = new Decimal(rawRecipe.quantity.toString()).mul(quantity);

        // How much to deduct from ingredient stock (in stock unit)
        const deductionInStockUnit = calculateStockDeduction(
          totalRecipeQty,
          recipeUnit,
          ingredientUnit,
        );

        // Cost contribution
        const costContribution = calculateRealCost(
          totalRecipeQty,
          recipeUnit,
          ingredientUnit,
          rawRecipe.ingredient.cost,
        );

        totalCost = totalCost.add(costContribution);

        const currentStock = new Decimal(rawRecipe.ingredient.stock.toString());

        // Pre-validate stock BEFORE opening transaction
        if (currentStock.lt(deductionInStockUnit)) {
          throw new BusinessError(
            `Estoque insuficiente de "${rawRecipe.ingredient.name}". ` +
            `Necessário: ${deductionInStockUnit.toFixed(4)} ${ingredientUnit}, ` +
            `Disponível: ${currentStock.toFixed(4)} ${ingredientUnit}.`
          );
        }

        consumptions.push({
          ingredientId: rawRecipe.ingredient.id,
          ingredientName: rawRecipe.ingredient.name,
          recipeQty: totalRecipeQty,
          recipeUnit,
          stockUnit: ingredientUnit,
          deductionInStockUnit,
          costContribution,
          currentStock,
        });
      }

      // ========================================
      // 3. TRANSACTION — All-or-nothing
      // ========================================

      return await db.$transaction(async (trx) => {
        // 3a. Deduct ingredient stock + create StockMovements
        for (const consumption of consumptions) {
          await recordStockMovement(
            {
              ingredientId: consumption.ingredientId,
              companyId,
              userId,
              type: "PRODUCTION",
              quantity: consumption.deductionInStockUnit.negated(),
              reason: `Produção de ${quantity}x ${product.name}`,
            },
            trx,
          );
        }

        // 3b. Increment product stock + create StockMovement
        await recordStockMovement(
          {
            productId,
            companyId,
            userId,
            type: "PRODUCTION",
            quantity: quantity,
            reason: `Produção de ${quantity} unidades`,
          },
          trx,
        );

        // 3c. Create ProductionOrder
        const productionOrder = await trx.productionOrder.create({
          data: {
            productId,
            companyId,
            quantity,
            totalCost,
            createdById: userId,
          },
        });

        return {
          productionOrder,
          totalCost,
          consumptions: consumptions.map((c) => ({
            ingredientName: c.ingredientName,
            deducted: c.deductionInStockUnit,
            unit: c.stockUnit,
            cost: c.costContribution,
          })),
        };
      });
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: {
          feature: "production",
          action: "produce",
        },
        extra: {
          productId,
          quantity,
          companyId,
          userId,
        },
      });
      throw error;
    }
  },
};

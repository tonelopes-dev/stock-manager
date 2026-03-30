import { db } from "@/app/_lib/prisma";
import { recordStockMovement } from "@/app/_lib/stock";
import { BusinessError } from "@/app/_lib/errors";
import { Prisma } from "@prisma/client";

const Decimal = Prisma.Decimal;

interface ProduceParams {
  productId: string;
  quantity: number;
  companyId: string;
  userId: string;
}

interface ComponentConsumption {
  childId: string;
  childName: string;
  quantityToDeduct: Prisma.Decimal;
  costContribution: Prisma.Decimal;
}

export const ProductionService = {
  /**
   * Produces a batch of a PRODUCAO_PROPRIA product.
   * 1. Validates product and composition.
   * 2. Inside a single transaction: deducts components (1 level), increments product stock,
   *    creates StockMovements, creates ProductionOrder.
   */
  async produce({ productId, quantity, companyId, userId }: ProduceParams) {
    try {
      if (quantity <= 0) {
        throw new BusinessError("A quantidade deve ser maior que zero.");
      }

      const product = await db.product.findFirst({
        where: { id: productId, companyId, isActive: true },
        include: {
          parentCompositions: {
            include: {
              child: true,
            },
          },
        },
      });

      if (!product) {
        throw new BusinessError("Produto não encontrado.");
      }

      if (product.type !== "PRODUCAO_PROPRIA") {
        throw new BusinessError("Apenas produtos do tipo Produção Própria podem ser produzidos manualmente.");
      }

      if (product.parentCompositions.length === 0) {
        throw new BusinessError("Este produto não possui composição cadastrada. Adicione itens à ficha técnica antes de produzir.");
      }

      const consumptions: ComponentConsumption[] = [];
      let totalCost = new Decimal(0);

      for (const composition of product.parentCompositions) {
        const child = composition.child;
        
        // Total deduction = composition.quantity × production quantity
        const quantityToDeduct = new Decimal(composition.quantity.toString()).mul(quantity);

        // Cost contribution = child.cost × quantityToDeduct
        const costContribution = new Decimal(child.cost.toString()).mul(quantityToDeduct);

        totalCost = totalCost.add(costContribution);

        consumptions.push({
          childId: child.id,
          childName: child.name,
          quantityToDeduct,
          costContribution,
        });
      }

      // TRANSACTION — All-or-nothing
      return await db.$transaction(async (trx) => {
        // 3a. Deduct component stock
        for (const consumption of consumptions) {
          await recordStockMovement(
            {
              productId: consumption.childId,
              companyId,
              userId,
              type: "PRODUCTION",
              quantity: consumption.quantityToDeduct.negated(),
              reason: `Consumo p/ produção de ${quantity}x ${product.name}`,
              forceAllowNegative: true, // Follow PDV logic: speed over blocking
            },
            trx,
          );
        }

        // 3b. Increment product stock
        await recordStockMovement(
          {
            productId,
            companyId,
            userId,
            type: "PRODUCTION",
            quantity: new Decimal(quantity),
            reason: `Entrada de produção: ${quantity} unidades`,
          },
          trx,
        );

        // 3c. Create ProductionOrder
        const productionOrder = await trx.productionOrder.create({
          data: {
            productId,
            companyId,
            quantity: Math.floor(quantity), // ProductionOrder quantity is Int in schema
            totalCost,
            createdById: userId,
          },
        });

        return {
          productionOrder,
          totalCost,
          consumptions,
        };
      });
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      console.error(error);
      throw error;
    }
  },
};

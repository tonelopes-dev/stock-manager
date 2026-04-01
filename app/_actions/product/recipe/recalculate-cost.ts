import { db } from "@/app/_lib/prisma";
import { calculateRealCost } from "@/app/_lib/units";
import { UnitType, Prisma } from "@prisma/client";

/**
 * Recalculates a product's cost from its composition/recipe
 * and recursively updates any parents that include this product.
 */
export async function recalculateProductCostRecursive(
  productId: string,
  trx?: Prisma.TransactionClient
) {
  const client = trx || db;

  // 1. Calculate this product's own cost based on its composition
  const compositions = await client.productComposition.findMany({
    where: { parentId: productId },
    include: { child: true },
  });

  // If it has a composition, calculate sum of children
  if (compositions.length > 0) {
    let totalCost = 0;
    for (const comp of compositions) {
      try {
        const partialCost = Number(
          calculateRealCost(
            comp.quantity.toNumber(),
            comp.child.unit as UnitType,
            comp.child.unit as UnitType,
            comp.child.cost.toNumber()
          )
        );
        totalCost += partialCost;
      } catch (error) {
        console.error(`Error calculating cost for composition item ${comp.id}:`, error);
      }
    }

    await client.product.update({
      where: { id: productId },
      data: { cost: totalCost },
    });
  }

  // 2. Recursively update all parent products that use this product as a component
  const parentCompositions = await client.productComposition.findMany({
    where: { childId: productId },
    select: { parentId: true },
  });

  for (const parent of parentCompositions) {
    await recalculateProductCostRecursive(parent.parentId, client);
  }
}

import "server-only";

import { db } from "@/app/_lib/prisma";
import { ProductType } from "@prisma/client";

/**
 * Calculates how many units of a product can be produced based on its ingredients' stock.
 * For MTO (PRODUCAO_PROPRIA) products, it looks at the technical sheet (ProductComposition).
 * For Resale (REVENDA) products, it returns the current physical stock.
 */
export async function calculateProductAvailability(productId: string, depth = 0): Promise<number> {
  // Safety break for circular dependencies
  if (depth > 10) return 0;

  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      parentCompositions: {
        include: {
          child: true,
        },
      },
    },
  });

  if (!product) return 0;

  // Base Case: If it's a resale product or NOT a composition type (MTO or COMBO), return physical stock
  const isCompositionType = product.type === ProductType.PRODUCAO_PROPRIA || product.type === ProductType.COMBO;
  
  if (!isCompositionType || !product.isMadeToOrder) {
    return Number(product.stock || 0);
  }

  // If it's a composition type but has no technical sheet, availability is 0
  if (product.parentCompositions.length === 0) {
    return 0;
  }

  const availabilityPerIngredient = await Promise.all(
    product.parentCompositions.map(async (composition) => {
      const qtyRequired = Number(composition.quantity || 0);
      if (qtyRequired <= 0) return Infinity;

      // RECURSION: If the child is ALSO a composition type, we calculate its virtual stock
      const childIsComposition = 
        composition.child.type === ProductType.PRODUCAO_PROPRIA || 
        composition.child.type === ProductType.COMBO;

      let childAvailableStock: number;
      
      if (childIsComposition && composition.child.isMadeToOrder) {
        // Recursive call with incremented depth
        childAvailableStock = await calculateProductAvailability(composition.childId, depth + 1);
      } else {
        // Base case for the child: just its physical stock
        childAvailableStock = Number(composition.child.stock || 0);
      }

      return Math.floor(childAvailableStock / qtyRequired);
    })
  );

  const virtualStock = Math.min(...availabilityPerIngredient);
  return Math.max(0, virtualStock);
}

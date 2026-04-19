import "server-only";

import { db } from "@/app/_lib/prisma";
import { ProductType } from "@prisma/client";

/**
 * Calculates how many units of a product can be produced based on its ingredients' stock.
 * For MTO (PRODUCAO_PROPRIA) products, it looks at the technical sheet (ProductComposition).
 * For Resale (REVENDA) products, it returns the current physical stock.
 */
export async function calculateProductAvailability(productId: string): Promise<number> {
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

  // If it's a resale product or not MTO, return physical stock
  if (product.type === ProductType.REVENDA || !product.isMadeToOrder) {
    return product.stock.toNumber();
  }

  // If it's MTO but has no technical sheet, return 0 or actual stock?
  // User context implies availability depends on sheet. If no sheet, availability is 0.
  if (product.parentCompositions.length === 0) {
    return 0;
  }

  const availabilityPerIngredient = product.parentCompositions.map((composition) => {
    const childStock = composition.child.stock.toNumber();
    const qtyRequired = composition.quantity.toNumber();

    if (qtyRequired <= 0) return Infinity;
    
    // Calculate how many units can be made with this specific ingredient
    return Math.floor(childStock / qtyRequired);
  });

  const virtualStock = Math.min(...availabilityPerIngredient);

  // Ensure we don't return negative values if some logic quirk happens
  return Math.max(0, virtualStock);
}

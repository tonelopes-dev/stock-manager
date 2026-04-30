"use server";

import { db } from "@/app/_lib/prisma";

export async function getPromotionsAction(companySlug: string) {
  try {
    const company = await db.company.findUnique({
      where: { slug: companySlug },
      select: { id: true }
    });

    if (!company) return { success: false, products: [] };

    const products = await db.product.findMany({
      where: {
        companyId: company.id,
        promoActive: true,
        promoPrice: { not: null },
        isVisibleOnMenu: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        promoPrice: true,
        promoActive: true,
        promoSchedule: true,
        isFeatured: true,
      },
      orderBy: { name: "asc" }
    });

    return {
      success: true,
      products: products.map(p => ({
        ...p,
        price: Number(p.price),
        promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
      }))
    };
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return { success: false, products: [] };
  }
}

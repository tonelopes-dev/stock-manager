import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface MenuManagementProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  isVisibleOnMenu: boolean;
  isPromotion: boolean;
  isActive: boolean;
  stock: number;
}

export interface MenuManagementCategory {
  id: string;
  name: string;
  icon: string | null;
  orderIndex: number;
  products: MenuManagementProduct[];
}

export const getMenuManagementData = async (): Promise<{
  categories: MenuManagementCategory[];
  companyId: string;
}> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return { categories: [], companyId: "" };

  const categories = await db.category.findMany({
    where: { companyId },
    orderBy: { orderIndex: "asc" },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          isVisibleOnMenu: true,
          isPromotion: true,
          isActive: true,
          stock: true,
        },
      },
    },
  });

  // Also get uncategorized products
  const uncategorized = await db.product.findMany({
    where: {
      companyId,
      isActive: true,
      categoryId: null,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      imageUrl: true,
      isVisibleOnMenu: true,
      isPromotion: true,
      isActive: true,
      stock: true,
    },
  });

  const result: MenuManagementCategory[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    orderIndex: cat.orderIndex,
    products: cat.products.map((p) => ({
      ...p,
      price: Number(p.price),
    })),
  }));

  if (uncategorized.length > 0) {
    result.push({
      id: "uncategorized",
      name: "Sem Categoria",
      icon: null,
      orderIndex: 9999,
      products: uncategorized.map((p) => ({
        ...p,
        price: Number(p.price),
      })),
    });
  }

  return { categories: result, companyId };
};

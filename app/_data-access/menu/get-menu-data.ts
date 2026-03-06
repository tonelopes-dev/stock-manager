import { db } from "@/app/_lib/prisma";

export interface MenuProductDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  isPromotion: boolean;
}

export interface MenuCategoryDto {
  id: string;
  name: string;
  icon: string | null;
  products: MenuProductDto[];
}

export interface MenuDataDto {
  companyName: string;
  categories: MenuCategoryDto[];
}

export const getMenuData = async (companyId: string): Promise<MenuDataDto | null> => {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  if (!company) return null;

  const categories = await db.productCategory.findMany({
    where: { companyId },
    orderBy: { orderIndex: "asc" },
    include: {
      products: {
        where: {
          isVisibleOnMenu: true,
          isActive: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  // Also fetch products visible on menu but not assigned to any category
  const uncategorized = await db.product.findMany({
    where: {
      companyId,
      isVisibleOnMenu: true,
      isActive: true,
      productCategories: { none: {} },
    },
    orderBy: { name: "asc" },
  });

  const result: MenuCategoryDto[] = categories
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      products: cat.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        price: Number(p.price),
        isPromotion: p.isPromotion,
      })),
    }))
    .filter((cat) => cat.products.length > 0);

  // Add uncategorized as "Destaques" if any exist
  if (uncategorized.length > 0) {
    result.unshift({
      id: "destaques",
      name: "Destaques",
      icon: "⭐",
      products: uncategorized.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        price: Number(p.price),
        isPromotion: p.isPromotion,
      })),
    });
  }

  return {
    companyName: company.name,
    categories: result,
  };
};


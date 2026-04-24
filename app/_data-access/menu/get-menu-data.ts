import { db } from "@/app/_lib/prisma";

export interface MenuProductDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  promoActive: boolean;
  promoPrice: number | null;
  promoSchedule: any;
  isFeatured: boolean;
}

export interface MenuCategoryDto {
  id: string;
  name: string;
  icon: string | null;
  products: MenuProductDto[];
}

export interface MenuDataDto {
  id: string;
  slug: string;
  companyName: string;
  bannerUrl: string | null;
  logoUrl: string | null;
  address: string | null;
  description: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;
  operatingHours: any;
  categories: MenuCategoryDto[];
}

export const getMenuData = async (companyId: string): Promise<MenuDataDto | null> => {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { 
      id: true,
      slug: true,
      name: true,
      bannerUrl: true,
      logoUrl: true,
      address: true,
      description: true,
      whatsappNumber: true,
      instagramUrl: true,
      operatingHours: true,
    },
  });

  if (!company) return null;

  return fetchMenuDetails(company, company.id);
};

export const getMenuDataBySlug = async (slug: string): Promise<MenuDataDto | null> => {
  const company = await db.company.findUnique({
    where: { slug },
    select: { 
      id: true,
      slug: true,
      name: true,
      bannerUrl: true,
      logoUrl: true,
      address: true,
      description: true,
      whatsappNumber: true,
      instagramUrl: true,
      operatingHours: true,
    },
  });

  if (!company) return null;

  return fetchMenuDetails(company, company.id);
};

const fetchMenuDetails = async (company: any, companyId: string): Promise<MenuDataDto> => {
  const categories = await db.category.findMany({
    where: { companyId },
    orderBy: { orderIndex: "asc" },
    include: {
      products: {
        where: {
          isVisibleOnMenu: true,
          isActive: true,
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          promoActive: true,
          promoPrice: true,
          promoSchedule: true,
          isFeatured: true,
        },
      },
    },
  });

  // Also fetch products visible on menu but not assigned to any category
  const uncategorized = await db.product.findMany({
    where: {
      companyId,
      isVisibleOnMenu: true,
      isActive: true,
      categoryId: null,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      price: true,
      promoActive: true,
      promoPrice: true,
      promoSchedule: true,
      isFeatured: true,
    },
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
        promoActive: p.promoActive,
        promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
        promoSchedule: p.promoSchedule,
        isFeatured: p.isFeatured,
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
        promoActive: p.promoActive,
        promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
        promoSchedule: p.promoSchedule,
        isFeatured: p.isFeatured,
      })),
    });
  }

  return {
    id: company.id,
    slug: company.slug,
    companyName: company.name,
    bannerUrl: company.bannerUrl,
    logoUrl: company.logoUrl,
    address: company.address,
    description: company.description,
    whatsappNumber: company.whatsappNumber,
    instagramUrl: company.instagramUrl,
    operatingHours: company.operatingHours,
    categories: result,
  };
};

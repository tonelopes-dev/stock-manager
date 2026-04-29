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
  availability: number;
  isMadeToOrder: boolean;
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
  requireSelfieOnCheckout: boolean;
  allowNegativeStock: boolean;
  categories: MenuCategoryDto[];
}

/**
 * Busca dados da empresa e delega a busca de produtos/categorias.
 * Otimizado para usar selects específicos e evitar sobrecarga do banco.
 */
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
      requireSelfieOnCheckout: true,
      allowNegativeStock: true,
    },
  });

  if (!company) return null;

  return fetchMenuDetails(company);
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
      requireSelfieOnCheckout: true,
      allowNegativeStock: true,
    },
  });

  if (!company) return null;

  return fetchMenuDetails(company);
};

/**
 * Centraliza a busca de categorias e produtos. 
 * Otimizado para reduzir latência removendo 'include' e usando 'select' aninhado.
 */
const fetchMenuDetails = async (company: any): Promise<MenuDataDto> => {
  const companyId = company.id;

  // Busca categorias e produtos vinculados em uma única query otimizada
  const categories = await db.category.findMany({
    where: { companyId },
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      name: true,
      icon: true,
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
          stock: true,
          isMadeToOrder: true,
          type: true,
          parentCompositions: {
            select: {
              quantity: true,
              child: {
                select: {
                  stock: true
                }
              }
            }
          }
        },
      },
    },
  });

  // Busca produtos sem categoria (Destaques/Avulsos)
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
      stock: true,
      isMadeToOrder: true,
      type: true,
      parentCompositions: {
        select: {
          quantity: true,
          child: {
            select: {
              stock: true
            }
          }
        }
      }
    },
  });

  // Mapeamento otimizado convertendo Decimal para Number para o DTO
  const result: MenuCategoryDto[] = categories
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      products: cat.products.map((p) => {
        let availability = Number(p.stock);
        if (p.isMadeToOrder && p.parentCompositions.length > 0) {
          const ingredientAvailabilities = p.parentCompositions.map((comp: any) => {
            const childStock = Number(comp.child.stock);
            const qtyRequired = Number(comp.quantity);
            return qtyRequired > 0 ? Math.floor(childStock / qtyRequired) : Infinity;
          });
          availability = Math.min(...ingredientAvailabilities);
        }

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          imageUrl: p.imageUrl,
          price: Number(p.price),
          promoActive: p.promoActive,
          promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
          promoSchedule: p.promoSchedule,
          isFeatured: p.isFeatured,
          isMadeToOrder: p.isMadeToOrder,
          availability: Math.max(0, availability),
        };
      }),
    }))
    .filter((cat) => cat.products.length > 0);

  // Adiciona produtos sem categoria no topo como "Destaques"
  if (uncategorized.length > 0) {
    result.unshift({
      id: "destaques",
      name: "Destaques",
      icon: "⭐",
      products: uncategorized.map((p) => {
        let availability = Number(p.stock);
        if (p.isMadeToOrder && p.parentCompositions.length > 0) {
          const ingredientAvailabilities = p.parentCompositions.map((comp: any) => {
            const childStock = Number(comp.child.stock);
            const qtyRequired = Number(comp.quantity);
            return qtyRequired > 0 ? Math.floor(childStock / qtyRequired) : Infinity;
          });
          availability = Math.min(...ingredientAvailabilities);
        }

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          imageUrl: p.imageUrl,
          price: Number(p.price),
          promoActive: p.promoActive,
          promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
          promoSchedule: p.promoSchedule,
          isFeatured: p.isFeatured,
          isMadeToOrder: p.isMadeToOrder,
          availability: Math.max(0, availability),
        };
      }),
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
    requireSelfieOnCheckout: company.requireSelfieOnCheckout,
    allowNegativeStock: company.allowNegativeStock,
    categories: result,
  };
};
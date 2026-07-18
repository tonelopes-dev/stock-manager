import "server-only";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { type PromotionSchedule } from "@/app/_utils/promotion";
import { type OperatingHoursDto } from "@/app/_data-access/company/types";

export interface MenuManagementProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  isVisibleOnMenu: boolean;
  promoActive: boolean;
  isActive: boolean;
  stock: number;
  promoPrice: number | null;
  promoSchedule: PromotionSchedule | null;
  isFeatured: boolean;
  environmentId: string | null;
}

export interface MenuManagementCategory {
  id: string;
  name: string;
  icon: string | null;
  orderIndex: number;
  products: MenuManagementProduct[];
}

export interface CompanyBranding {
  name: string;
  slug: string;
  bannerUrl: string | null;
  logoUrl: string | null;
  address: string | null;
  description: string | null;
  whatsappNumber: string | null;
  instagramUrl: string | null;
  operatingHours: OperatingHoursDto[] | null;
  requireSelfieOnCheckout: boolean;
  allowNegativeStock: boolean;
  estimatedMonthlyVolume: number;
  enableOverheadInjection: boolean;
  enableServiceTax: boolean;
}

export const getMenuManagementData = async (): Promise<{
  categories: MenuManagementCategory[];
  companyId: string;
  company: CompanyBranding | null;
}> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return { categories: [], companyId: "", company: null };

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      slug: true,
      bannerUrl: true,
      logoUrl: true,
      address: true,
      description: true,
      whatsappNumber: true,
      instagramUrl: true,
      operatingHours: true,
      requireSelfieOnCheckout: true,
      allowNegativeStock: true,
      estimatedMonthlyVolume: true,
      enableOverheadInjection: true,
      enableServiceTax: true,
    },
  });

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
          promoActive: true,
          isActive: true,
          stock: true,
          promoPrice: true,
          promoSchedule: true,
          isFeatured: true,
          environmentId: true,
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
      promoActive: true,
      isActive: true,
      stock: true,
      promoPrice: true,
      promoSchedule: true,
      isFeatured: true,
      environmentId: true,
    },
  });

  const result: MenuManagementCategory[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    orderIndex: cat.orderIndex,
    products: cat.products.map((p) => ({
      ...p,
      price: p.price.toNumber(),
      stock: p.stock.toNumber(),
      promoPrice: p.promoPrice ? p.promoPrice.toNumber() : null,
      promoActive: p.promoActive,
      promoSchedule: p.promoSchedule as PromotionSchedule | null,
      isFeatured: p.isFeatured,
      environmentId: p.environmentId,
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
        price: p.price.toNumber(),
        stock: p.stock.toNumber(),
        promoPrice: p.promoPrice ? p.promoPrice.toNumber() : null,
        promoActive: p.promoActive,
        promoSchedule: p.promoSchedule as PromotionSchedule | null,
        isFeatured: p.isFeatured,
        environmentId: p.environmentId,
      })),
    });
  }

  return { 
    categories: result, 
    companyId, 
    company: company ? {
      ...company,
      operatingHours: company.operatingHours as OperatingHoursDto[] | null
    } : null 
  };
};

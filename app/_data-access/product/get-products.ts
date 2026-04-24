import "server-only";

import { db } from "@/app/_lib/prisma";
import { Product, Prisma, ProductType } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { calculateMargin } from "@/app/_lib/pricing";
import { subDays } from "date-fns";
import { sanitizeUUID } from "@/app/_lib/uuid";

export type ProductStatusDto = "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK" | "SLOW_MOVING";

export interface ProductDto extends Omit<Product, "price" | "cost" | "operationalCost" | "category" | "stock" | "minStock" | "promoPrice" | "promoSchedule"> {
  price: number;
  cost: number;
  operationalCost: number;
  margin: number;
  stock: number;
  minStock: number;
  status: ProductStatusDto;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
  expirationDate: Date | null;
  trackExpiration: boolean;
  environment?: { id: string; name: string } | null;
  promoPrice: number | null;
  promoActive: boolean;
  promoSchedule: any;
  isFeatured: boolean;
  virtualStock: number;
  limitingIngredient?: string;
  ingredients?: { name: string; availability: number }[];
  allowNegativeStock: boolean;
  _count?: {
    saleItems: number;
    productionOrders: number;
  };
}

export const getProducts = async (
  slowMovingDays = 30, 
  status: "ACTIVE" | "INACTIVE" | "ALL" = "ACTIVE",
  environmentId?: string,
  types?: ProductType[],
  categoryId?: string
): Promise<ProductDto[]> => {
  const companyId = await getCurrentCompanyId();
  const slowMovingThreshold = subDays(new Date(), slowMovingDays);

  const where: Prisma.ProductWhereInput = { companyId, isActive: true };
  
  if (status === "INACTIVE") {
    where.isActive = false;
  } else if (status === "ALL") {
    delete where.isActive;
  }

  // UUID Sanitization & Validation (PostgreSQL 22P03 protection)
  const sanitizedEnvironmentId = sanitizeUUID(environmentId);
  const sanitizedCategoryId = sanitizeUUID(categoryId);

  if (sanitizedEnvironmentId) {
    where.environmentId = sanitizedEnvironmentId;
  }

  if (sanitizedCategoryId) {
    where.categoryId = sanitizedCategoryId;
  }

  if (types && types.length > 0) {
    where.type = { in: types };
  }

  const products = await db.product.findMany({
    where,

    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          saleItems: true,
          productionOrders: true,
        },
      },
      saleItems: {
        where: {
          sale: {
            status: "ACTIVE",
            date: { gte: slowMovingThreshold },
          },
        },
        take: 1,
      },
      parentCompositions: {
        include: {
          child: true,
        },
      },
      category: {
        select: { id: true, name: true },
      },
      environment: {
        select: { id: true, name: true },
      },
      company: {
        select: { allowNegativeStock: true },
      },
    }
  });

  return products.map((product) => {
    const stock = product.stock.toNumber();
    const minStock = product.minStock.toNumber();
    const price = product.price.toNumber();
    const cost = product.cost.toNumber();
    const operationalCost = product.operationalCost.toNumber();

    const isOutOfStock = stock <= 0;
    const isLowStock = stock <= minStock;
    const isSlowMoving = product.saleItems.length === 0 && !isOutOfStock;

    // The cost is now persisted in the DB and updated by the action
    const effectiveCost = cost;

    let virtualStock = stock;
    let limitingIngredient: string | undefined;
    let ingredients: { name: string; availability: number }[] | undefined;

    if (product.isMadeToOrder && product.parentCompositions.length > 0) {
      let minCapacity = Infinity;
      ingredients = product.parentCompositions.map(comp => {
        const childStock = comp.child.stock.toNumber();
        const qtyRequired = comp.quantity.toNumber();
        const capacity = qtyRequired > 0 ? Math.floor(childStock / qtyRequired) : Infinity;
        
        if (capacity < minCapacity) {
          minCapacity = capacity;
          limitingIngredient = comp.child.name;
        }

        return {
          name: comp.child.name,
          availability: capacity === Infinity ? 0 : capacity
        };
      });
      virtualStock = Math.max(0, minCapacity);
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      type: product.type,
      sku: product.sku,
      unit: product.unit,
      stock: stock,
      minStock: minStock,
      isActive: product.isActive,
      isVisibleOnMenu: product.isVisibleOnMenu,
      companyId: product.companyId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      price: price,
      cost: cost,
      operationalCost: operationalCost,
      margin: calculateMargin(price, cost + operationalCost),
      status: isOutOfStock
        ? "OUT_OF_STOCK"
        : isLowStock
        ? "LOW_STOCK"
        : isSlowMoving
        ? "SLOW_MOVING"
        : "IN_STOCK",
      _count: product._count,
      categoryId: product.categoryId,
      category: product.category,
      environmentId: product.environmentId,
      environment: product.environment,
      expirationDate: product.expirationDate,
      trackExpiration: product.trackExpiration,
      expirationReminderDate: product.expirationReminderDate,
      isMadeToOrder: product.isMadeToOrder,
      virtualStock,
      limitingIngredient,
      ingredients,
      allowNegativeStock: product.company.allowNegativeStock,
      promoPrice: product.promoPrice ? product.promoPrice.toNumber() : null,
      promoActive: product.promoActive,
      promoSchedule: product.promoSchedule,
      isFeatured: product.isFeatured,
    };
  });
};

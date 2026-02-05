import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { SalesReportSchema } from "./schema";

export interface ProductReportDto {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface SalesReportDto {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  products: ProductReportDto[];
}

export const getSalesReport = async (
  filters: SalesReportSchema
): Promise<SalesReportDto> => {
  const companyId = await getCurrentCompanyId();

  const sales = await db.sale.findMany({
    where: {
      companyId,
      status: "ACTIVE",
      date: {
        gte: filters.from,
        lte: filters.to,
      },
    },
    include: {
      saleProducts: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const productMap = new Map<string, ProductReportDto>();
  let totalRevenue = 0;
  let totalCost = 0;

  for (const sale of sales) {
    for (const item of sale.saleProducts) {
      const revenue = Number(item.unitPrice) * item.quantity;
      const cost = Number(item.baseCost) * item.quantity;
      const profit = revenue - cost;

      totalRevenue += revenue;
      totalCost += cost;

      const existing = productMap.get(item.productId);
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += revenue;
        existing.cost += cost;
        existing.profit += profit;
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          name: item.product.name,
          quantitySold: item.quantity,
          revenue,
          cost,
          profit,
        });
      }
    }
  }

  return {
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
    products: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
  };
};

import "server-only";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
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
      saleItems: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const productMap = new Map<string, ProductReportDto>();
  let totalRevenue = 0;
  let totalCost = 0;

  sales.forEach((sale) => {
    const items = sale.saleItems || [];
    
    items.forEach((item) => {
      const revenue = Number(item.unitPrice) * Number(item.quantity);
      const cost = Number(item.baseCost) * Number(item.quantity);
      const profit = revenue - cost;

      totalRevenue += revenue;
      totalCost += cost;

      const existing = productMap.get(item.productId);
      if (existing) {
        existing.quantitySold += Number(item.quantity);
        existing.revenue += revenue;
        existing.cost += cost;
        existing.profit += profit;
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          name: item.product.name,
          quantitySold: Number(item.quantity),
          revenue,
          cost,
          profit,
        });
      }
    });
  });

  return {
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
    products: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
  };
};

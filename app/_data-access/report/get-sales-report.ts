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

  interface SaleWithItems {
    id: string;
    date: Date;
    saleItems: {
        productId: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unitPrice: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        baseCost: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quantity: any;
        product: { name: string };
    }[];
  }

  const rawSales = await db.sale.findMany({
    where: {
      companyId,
      status: "ACTIVE",
      date: {
        gte: filters.from,
        lte: filters.to,
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    orderBy: { date: "desc" },
  });

  const sales = rawSales as unknown as SaleWithItems[];

  const productMap = new Map<string, ProductReportDto>();
  let totalRevenue = 0;
  let totalCost = 0;

  sales.forEach((sale) => {
    const items = sale.saleItems || [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items.forEach((item: any) => {
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

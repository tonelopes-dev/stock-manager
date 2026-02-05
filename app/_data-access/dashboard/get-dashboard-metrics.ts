import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { startOfDay, endOfDay } from "date-fns";

export interface DashboardMetricsDto {
  dailyRevenue: number;
  dailyProfit: number;
  averageTicket: number;
  topSellingProducts: {
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }[];
  lowStockProducts: {
    id: string;
    name: string;
    stock: number;
    minStock: number;
  }[];
}

export const getDashboardMetrics = async (): Promise<DashboardMetricsDto> => {
  const companyId = await getCurrentCompanyId();
  const today = new Date();
  
  // 1. Fetch Today's aggregated metrics
  const saleProductsToday = await db.saleProduct.findMany({
    where: {
      sale: {
        companyId,
        status: "ACTIVE",
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    },
    select: {
      quantity: true,
      unitPrice: true,
      baseCost: true,
    },
  });

  let dailyRevenue = 0;
  let dailyProfit = 0;
  let totalSalesToday = new Set();

  // Still calculate daily metrics via loop as it's usually a small dataset per day, 
  // but we fetched only the necessary decimal fields.
  for (const item of saleProductsToday) {
    const revenue = Number(item.unitPrice) * item.quantity;
    const cost = Number(item.baseCost) * item.quantity;
    dailyRevenue += revenue;
    dailyProfit += (revenue - cost);
  }

  // Count unique sales today for average ticket
  const salesCountToday = await db.sale.count({
    where: {
      companyId,
      status: "ACTIVE",
      date: { gte: startOfDay(today), lte: endOfDay(today) },
    }
  });

  const averageTicket = salesCountToday > 0 ? dailyRevenue / salesCountToday : 0;

  // 2. Fetch Top Selling Products using GroupBy (MUCH FASTER)
  const topSellingAggregation = await db.saleProduct.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
    },
    where: {
      sale: {
        companyId,
        status: "ACTIVE",
      },
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 5,
  });

  // Fetch names and prices for these top products
  const topProducts = await Promise.all(
    topSellingAggregation.map(async (agg) => {
      const product = await db.product.findUnique({
        where: { id: agg.productId },
        select: { name: true, price: true },
      });
      return {
        id: agg.productId,
        name: product?.name || "Desconhecido",
        quantitySold: agg._sum.quantity || 0,
        revenue: (Number(product?.price) || 0) * (agg._sum.quantity || 0),
      };
    })
  );

  // 3. Fetch Low Stock Products with raw SQL or targeted findMany
  // Since Prisma doesn't support 'stock <= minStock' in where comfortably:
  const lowStockProducts = await db.$queryRaw<any[]>`
    SELECT id, name, stock, "minStock"
    FROM "Product"
    WHERE "companyId" = ${companyId} 
      AND "isActive" = true 
      AND "stock" <= "minStock"
      AND "stock" < 1000 -- Sanity check
    ORDER BY "stock" ASC
    LIMIT 5
  `.then(rows => rows.map(r => ({
    id: r.id,
    name: r.name,
    stock: r.stock,
    minStock: r.minStock
  })));

  return {
    dailyRevenue,
    dailyProfit,
    averageTicket,
    topSellingProducts: topProducts,
    lowStockProducts,
  };
};

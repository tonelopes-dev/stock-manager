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
  const start = startOfDay(today);
  const end = endOfDay(today);

  // 1. Get Daily Totals (Revenue, Cost, Profit) in ONE highly optimized query
  // We use queryRaw because cross-column math (price * qty) isn't supported by standard .aggregate()
  const [dailyTotals] = await db.$queryRaw<any[]>`
    SELECT 
      COALESCE(SUM("unitPrice" * "quantity"), 0)::float as revenue,
      COALESCE(SUM("baseCost" * "quantity"), 0)::float as cost,
      COUNT(DISTINCT "saleId")::int as "salesCount"
    FROM "SaleProduct"
    JOIN "Sale" ON "Sale"."id" = "SaleProduct"."saleId"
    WHERE "Sale"."companyId" = ${companyId}
      AND "Sale"."status" = 'ACTIVE'
      AND "Sale"."date" >= ${start}
      AND "Sale"."date" <= ${end}
  `;

  const dailyRevenue = dailyTotals.revenue;
  const dailyProfit = dailyTotals.revenue - dailyTotals.cost;
  const averageTicket = dailyTotals.salesCount > 0 ? dailyRevenue / dailyTotals.salesCount : 0;

  // 2. Fetch Top Selling Products (By REVENUE, using historical prices and single query)
  const topProducts = await db.$queryRaw<any[]>`
    SELECT 
      p.id, 
      p.name, 
      SUM(sp.quantity)::int as "quantitySold",
      SUM(sp."unitPrice" * sp.quantity)::float as revenue
    FROM "SaleProduct" sp
    JOIN "Sale" s ON s.id = sp."saleId"
    JOIN "Product" p ON p.id = sp."productId"
    WHERE s."companyId" = ${companyId}
      AND s.status = 'ACTIVE'
    GROUP BY p.id, p.name
    ORDER BY revenue DESC
    LIMIT 5
  `;

  // 3. Low Stock Products (Database level comparison)
  const lowStockProducts = await db.$queryRaw<any[]>`
    SELECT id, name, stock, "minStock"
    FROM "Product"
    WHERE "companyId" = ${companyId} 
      AND "isActive" = true 
      AND "stock" <= "minStock"
    ORDER BY "stock" ASC
    LIMIT 5
  `;

  return {
    dailyRevenue,
    dailyProfit,
    averageTicket,
    topSellingProducts: topProducts.map(p => ({
      id: p.id,
      name: p.name,
      quantitySold: p.quantitySold,
      revenue: p.revenue
    })),
    lowStockProducts: lowStockProducts.map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      minStock: p.minStock
    })),
  };
};

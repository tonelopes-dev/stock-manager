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

  // 2. Fetch Top Selling Products using GroupBy
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

  // Fetch product metadata for the top 5
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
    topSellingProducts: topProducts,
    lowStockProducts: lowStockProducts.map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      minStock: p.minStock
    })),
  };
};

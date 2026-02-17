import { db } from "@/app/_lib/prisma";
import { Prisma, SaleStatus } from "@prisma/client";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface FinancialOverview {
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;
}

export interface DailySalesData {
  day: Date;
  revenue: number;
  cogs: number;
}

export interface ProductRanking {
  productId: string;
  productName: string;
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;
}

interface DailySalesRaw {
  day: Date;
  revenue: number;
  cogs: number;
}

interface ProductRankingRaw {
  productId: string;
  productName: string;
  revenue: number;
  cogs: number;
  profit: number;
  margin?: number;
}

/**
 * Returns an executive financial summary based on aggregated Sale fields.
 * Uses totalAmount and totalCost fields for O(1) item access.
 */
export async function getFinancialOverview(
  companyId: string,
  range: DateRange
): Promise<FinancialOverview> {
  const { startDate, endDate } = range;

  // 1. Protection against invalid date ranges
  if (startDate > endDate) {
    throw new Error("Invalid date range");
  }

  // 2. Perform aggregation directly in the database
  // We use explicit Prisma types and an unknown cast to satisfy IDE-only inference desync 
  // without triggering ESLint 'any' warnings or build failures.
  const aggregation = (await db.sale.aggregate({
    where: {
      companyId,
      status: SaleStatus.ACTIVE,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      totalAmount: true,
      totalCost: true,
    },
  } as Prisma.SaleAggregateArgs)) as unknown as {
    _sum: {
      totalAmount: number | null;
      totalCost: number | null;
    };
  };

  // 3. Extract values and handle potential nulls
  const revenue = Number(aggregation._sum.totalAmount ?? 0);
  const cogs = Number(aggregation._sum.totalCost ?? 0);

  // 3. Calculate derived metrics
  const profit = revenue - cogs;
  
  // Calculate margin, preventing division by zero
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    revenue,
    cogs,
    profit,
    margin,
  };
}

/**
 * Returns sales data grouped by day for the requested range.
 * Uses Raw SQL for performance and Node.js for gap filling.
 */
export async function getDailySalesChart(
  companyId: string,
  range: DateRange
): Promise<DailySalesData[]> {
  const { startDate, endDate } = range;

  if (startDate > endDate) {
    throw new Error("Invalid date range");
  }

  // 1. Query raw totals grouped by day
  const results = await db.$queryRaw<DailySalesRaw[]>`
    SELECT 
      DATE_TRUNC('day', "date") as day,
      SUM("totalAmount") as revenue,
      SUM("totalCost") as cogs
    FROM "Sale"
    WHERE "companyId" = ${companyId}
      AND "status" = 'ACTIVE'
      AND "date" BETWEEN ${startDate} AND ${endDate}
    GROUP BY day
    ORDER BY day ASC;
  `;

  // 2. Gap Filling in Node.js
  const resultMap = new Map(
    results.map((r) => [new Date(r.day).toISOString().split("T")[0], r])
  );

  const filledResults: DailySalesData[] = [];
  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  const finalDate = new Date(endDate);
  finalDate.setUTCHours(0, 0, 0, 0);

  while (current <= finalDate) {
    const key = current.toISOString().split("T")[0];
    const data = resultMap.get(key);

    filledResults.push({
      day: new Date(current),
      revenue: Number(data?.revenue ?? 0),
      cogs: Number(data?.cogs ?? 0),
    });

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return filledResults;
}

/**
 * Returns the top 10 products by absolute profit (Revenue - COGS).
 */
export async function getTopProfitableProducts(
  companyId: string,
  range: DateRange
): Promise<ProductRanking[]> {
  const { startDate, endDate } = range;

  if (startDate > endDate) {
    throw new Error("Invalid date range");
  }

  const results = await db.$queryRaw<ProductRankingRaw[]>`
    SELECT
      si."productId",
      p."name" as "productName",
      SUM(si."totalAmount") as revenue,
      SUM(si."totalCost") as cogs,
      SUM(si."totalAmount" - si."totalCost") as profit
    FROM "SaleProduct" si
    JOIN "Sale" s ON s.id = si."saleId"
    JOIN "Product" p ON p.id = si."productId"
    WHERE
      s."companyId" = ${companyId}
      AND s."status" = 'ACTIVE'
      AND s."date" BETWEEN ${startDate} AND ${endDate}
    GROUP BY si."productId", p."name"
    ORDER BY profit DESC
    LIMIT 10;
  `;

  return results.map((r) => ({
    productId: r.productId,
    productName: r.productName,
    revenue: Number(r.revenue),
    cogs: Number(r.cogs),
    profit: Number(r.profit),
    margin: r.revenue > 0 ? (Number(r.profit) / Number(r.revenue)) * 100 : 0,
  }));
}

/**
 * Returns the bottom 10 products by margin percentage.
 * Only treats products with at least one sale.
 */
export async function getWorstMarginProducts(
  companyId: string,
  range: DateRange
): Promise<ProductRanking[]> {
  const { startDate, endDate } = range;

  if (startDate > endDate) {
    throw new Error("Invalid date range");
  }

  const results = await db.$queryRaw<ProductRankingRaw[]>`
    SELECT
      si."productId",
      p."name" as "productName",
      SUM(si."totalAmount") as revenue,
      SUM(si."totalCost") as cogs,
      SUM(si."totalAmount" - si."totalCost") as profit,
      CASE 
        WHEN SUM(si."totalAmount") > 0 
        THEN (SUM(si."totalAmount" - si."totalCost") / SUM(si."totalAmount")) * 100 
        ELSE 0 
      END as margin
    FROM "SaleProduct" si
    JOIN "Sale" s ON s.id = si."saleId"
    JOIN "Product" p ON p.id = si."productId"
    WHERE
      s."companyId" = ${companyId}
      AND s."status" = 'ACTIVE'
      AND s."date" BETWEEN ${startDate} AND ${endDate}
    GROUP BY si."productId", p."name"
    HAVING SUM(si."totalAmount") > 0
    ORDER BY margin ASC
    LIMIT 10;
  `;

  return results.map((r) => ({
    productId: r.productId,
    productName: r.productName,
    revenue: Number(r.revenue),
    cogs: Number(r.cogs),
    profit: Number(r.profit),
    margin: Number(r.margin),
  }));
}

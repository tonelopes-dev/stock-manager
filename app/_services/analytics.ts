import { db } from "@/app/_lib/prisma";
import { startOfDay, format } from "date-fns";

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

  // 2. Perform raw aggregation across Sale items to ensure accuracy
  // We join Sale with SaleItem to sum the actual item values
  const results = await db.$queryRaw<{ revenue: number; cost: number }[]>`
    SELECT 
      COALESCE(SUM(si."unitPrice" * si."quantity"), 0)::float as revenue,
      COALESCE(SUM(si."baseCost" * si."quantity"), 0)::float as cost
    FROM "SaleProduct" si
    JOIN "Sale" s ON s.id = si."saleId"
    WHERE s."companyId" = ${companyId}
      AND s."status" = 'ACTIVE'
      AND s."date" >= ${startDate}
      AND s."date" < ${endDate}
  `;

  // 3. Extract values
  const revenue = results[0].revenue;
  const cogs = results[0].cost;

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

  // 1. Query raw totals grouped by day, joining SaleItem for precision
  const results = await db.$queryRaw<DailySalesRaw[]>`
    SELECT 
      DATE_TRUNC('day', s."date") as day,
      SUM(si."unitPrice" * si."quantity") as revenue,
      SUM(si."baseCost" * si."quantity") as cogs
    FROM "SaleProduct" si
    JOIN "Sale" s ON s.id = si."saleId"
    WHERE s."companyId" = ${companyId}
      AND s."status" = 'ACTIVE'
      AND s."date" >= ${startDate}
      AND s."date" < ${endDate}
    GROUP BY day
    ORDER BY day ASC;
  `;

  // 2. Gap Filling using Local Dates
  const resultMap = new Map(
    results.map((r) => [format(new Date(r.day), "yyyy-MM-dd"), r])
  );

  const filledResults: DailySalesData[] = [];
  let current = startOfDay(new Date(startDate));
  const finalDate = startOfDay(new Date(endDate));

  while (current < finalDate) {
    const key = format(current, "yyyy-MM-dd");
    const data = resultMap.get(key);

    filledResults.push({
      day: new Date(current),
      revenue: Number(data?.revenue ?? 0),
      cogs: Number(data?.cogs ?? 0),
    });

    current = new Date(current.setDate(current.getDate() + 1));
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
      SUM(si."unitPrice" * si."quantity") as revenue,
      SUM(si."baseCost" * si."quantity") as cogs,
      SUM((si."unitPrice" * si."quantity") - (si."baseCost" * si."quantity")) as profit
    FROM "SaleProduct" si
    JOIN "Sale" s ON s.id = si."saleId"
    JOIN "Product" p ON p.id = si."productId"
    WHERE
      s."companyId" = ${companyId}
      AND s."status" = 'ACTIVE'
      AND s."date" >= ${startDate}
      AND s."date" < ${endDate}
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
      SUM(si."unitPrice" * si."quantity") as revenue,
      SUM(si."baseCost" * si."quantity") as cogs,
      SUM((si."unitPrice" * si."quantity") - (si."baseCost" * si."quantity")) as profit,
      CASE 
        WHEN SUM(si."unitPrice" * si."quantity") > 0 
        THEN (SUM((si."unitPrice" * si."quantity") - (si."baseCost" * si."quantity")) / SUM(si."unitPrice" * si."quantity")) * 100 
        ELSE 0 
      END as margin
    FROM "SaleProduct" si
    JOIN "Sale" s ON s.id = si."saleId"
    JOIN "Product" p ON p.id = si."productId"
    WHERE
      s."companyId" = ${companyId}
      AND s."status" = 'ACTIVE'
      AND s."date" >= ${startDate}
      AND s."date" < ${endDate}
    GROUP BY si."productId", p."name"
    HAVING SUM(si."unitPrice" * si."quantity") > 0
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

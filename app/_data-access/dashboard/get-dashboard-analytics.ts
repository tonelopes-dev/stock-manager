import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  format,
  eachDayOfInterval,
  isSameDay
} from "date-fns";

export type DashboardRange = "today" | "7d" | "14d" | "30d" | "month" | "custom";

export interface AnalyticsMetric {
    value: number;
    trend: number; // Percentage change
}

export interface DashboardAnalyticsDto {
    totalRevenue: AnalyticsMetric;
    totalSales: AnalyticsMetric;
    averageTicket: AnalyticsMetric;
    totalProfit: AnalyticsMetric;
    revenueTimeSeries: {
        date: string;
        revenue: number;
    }[];
}

export const getDashboardAnalytics = async (range: DashboardRange = "7d"): Promise<DashboardAnalyticsDto> => {
    const companyId = await getCurrentCompanyId();
    
    // 1. Define Intervals
    const now = new Date();
    const endOfCurrent = endOfDay(now);
    
    let daysCount = 7;
    if (range === "today") daysCount = 1;
    if (range === "14d") daysCount = 14;
    if (range === "30d") daysCount = 30;
    if (range === "month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        daysCount = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    const startOfCurrent = startOfDay(subDays(now, daysCount - 1));
    const startOfPrevious = startOfDay(subDays(startOfCurrent, daysCount));
    const endOfPrevious = endOfDay(subDays(startOfCurrent, 1));

    // 2. Fetch Metrics for both periods in parallel
    const [currentMetrics, previousMetrics] = await Promise.all([
        fetchMetrics(companyId, startOfCurrent, endOfCurrent),
        fetchMetrics(companyId, startOfPrevious, endOfPrevious)
    ]);

    // 3. Calculate Trends
    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    // 4. Fetch Time Series Data
    const sales = await db.sale.findMany({
        where: {
            companyId,
            status: "ACTIVE",
            date: { gte: startOfCurrent, lte: endOfCurrent }
        },
        include: {
            saleProducts: true
        }
    });

    const days = eachDayOfInterval({ start: startOfCurrent, end: endOfCurrent });
    const timeSeries = days.map(day => {
        const daySales = sales.filter(sale => isSameDay(sale.date, day));
        const dayRevenue = daySales.reduce((acc, sale) => {
            return acc + sale.saleProducts.reduce((sum, sp) => sum + (Number(sp.unitPrice) * sp.quantity), 0);
        }, 0);

        return {
            date: format(day, "dd/MM"),
            revenue: dayRevenue
        };
    });

    return {
        totalRevenue: {
            value: currentMetrics.revenue,
            trend: calculateTrend(currentMetrics.revenue, previousMetrics.revenue)
        },
        totalSales: {
            value: currentMetrics.salesCount,
            trend: calculateTrend(currentMetrics.salesCount, previousMetrics.salesCount)
        },
        averageTicket: {
            value: currentMetrics.salesCount > 0 ? currentMetrics.revenue / currentMetrics.salesCount : 0,
            trend: calculateTrend(
                currentMetrics.salesCount > 0 ? currentMetrics.revenue / currentMetrics.salesCount : 0,
                previousMetrics.salesCount > 0 ? previousMetrics.revenue / previousMetrics.salesCount : 0
            )
        },
        totalProfit: {
            value: currentMetrics.revenue - currentMetrics.cost,
            trend: calculateTrend(currentMetrics.revenue - currentMetrics.cost, previousMetrics.revenue - previousMetrics.cost)
        },
        revenueTimeSeries: timeSeries
    };
};

interface RawMetricTotals {
    revenue: number;
    cost: number;
    salesCount: number;
}

async function fetchMetrics(companyId: string, start: Date, end: Date) {
    const totals = await db.$queryRaw<RawMetricTotals[]>`
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

    return {
        revenue: totals[0].revenue,
        cost: totals[0].cost,
        salesCount: totals[0].salesCount
    };
}

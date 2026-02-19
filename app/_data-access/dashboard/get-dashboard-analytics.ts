import "server-only";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { 
  startOfDay, 
  subDays, 
  addDays,
  format,
} from "date-fns";
import { 
    getFinancialOverview, 
    getDailySalesChart, 
    DailySalesData,
    getTopProfitableProducts,
    getWorstMarginProducts,
    ProductRanking
} from "@/app/_services/analytics";
import { db } from "@/app/_lib/prisma";
import { SaleStatus } from "@prisma/client";

export type DashboardRange = "today" | "7d" | "14d" | "30d" | "month" | "custom";

export interface AnalyticsMetric {
    value: number;
    trend: number; // Percentage change
}

export interface DashboardAnalyticsDto {
    revenue: AnalyticsMetric;
    cogs: AnalyticsMetric;
    profit: AnalyticsMetric;
    margin: AnalyticsMetric;
    salesCount: AnalyticsMetric;
    averageTicket: AnalyticsMetric;
    revenueTimeSeries: {
        date: string;
        revenue: number;
        cogs: number;
    }[];
    topProfitable: ProductRanking[];
    worstMargin: ProductRanking[];
}

export const getDashboardAnalytics = async (
    range: DashboardRange = "30d",
    customFrom?: string,
    customTo?: string,
): Promise<DashboardAnalyticsDto> => {
    const companyId = await getCurrentCompanyId();
    
    // 1. Define Intervals
    const now = new Date();
    let endOfCurrentDate: Date;
    let startOfCurrentDate: Date;
    let daysCount: number;

    const parseLocalDay = (dateStr: string) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    if (range === "custom" && customFrom && customTo) {
        startOfCurrentDate = startOfDay(parseLocalDay(customFrom));
        endOfCurrentDate = startOfDay(addDays(parseLocalDay(customTo), 1)); // Start of next day
        daysCount = Math.ceil((endOfCurrentDate.getTime() - startOfCurrentDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
        endOfCurrentDate = startOfDay(addDays(now, 1)); // Start of tomorrow
        daysCount = 7;
        if (range === "today") daysCount = 1;
        if (range === "14d") daysCount = 14;
        if (range === "30d") daysCount = 30;
        if (range === "month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            daysCount = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
        startOfCurrentDate = startOfDay(subDays(now, daysCount - 1));
    }

    const startOfPrevious = startOfDay(subDays(startOfCurrentDate, daysCount));
    const endOfPrevious = startOfCurrentDate; // Exclusive boundary is the start of current period


    // 2. Fetch Metrics using AnalyticsService in parallel
    const [
        currentMetrics, 
        previousMetrics, 
        timeSeriesData, 
        currentSalesCount, 
        previousSalesCount,
        topProfitable,
        worstMargin
    ] = await Promise.all([
        getFinancialOverview(companyId, { startDate: startOfCurrentDate, endDate: endOfCurrentDate }),
        getFinancialOverview(companyId, { startDate: startOfPrevious, endDate: endOfPrevious }),
        getDailySalesChart(companyId, { startDate: startOfCurrentDate, endDate: endOfCurrentDate }),
        fetchSalesCount(companyId, startOfCurrentDate, endOfCurrentDate),
        fetchSalesCount(companyId, startOfPrevious, endOfPrevious),
        getTopProfitableProducts(companyId, { startDate: startOfCurrentDate, endDate: endOfCurrentDate }),
        getWorstMarginProducts(companyId, { startDate: startOfCurrentDate, endDate: endOfCurrentDate })
    ]);

    // 3. Calculate Trends
    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    // 4. Format Time Series
    const revenueTimeSeries = timeSeriesData.map((data: DailySalesData) => ({
        date: format(data.day, "dd/MM"),
        revenue: data.revenue,
        cogs: data.cogs
    }));

    return {
        revenue: {
            value: currentMetrics.revenue,
            trend: calculateTrend(currentMetrics.revenue, previousMetrics.revenue)
        },
        cogs: {
            value: currentMetrics.cogs,
            trend: calculateTrend(currentMetrics.cogs, previousMetrics.cogs)
        },
        profit: {
            value: currentMetrics.profit,
            trend: calculateTrend(currentMetrics.profit, previousMetrics.profit)
        },
        margin: {
            value: currentMetrics.margin,
            trend: calculateTrend(currentMetrics.margin, previousMetrics.margin)
        },
        salesCount: {
            value: currentSalesCount,
            trend: calculateTrend(currentSalesCount, previousSalesCount)
        },
        averageTicket: {
            value: currentSalesCount > 0 ? currentMetrics.revenue / currentSalesCount : 0,
            trend: calculateTrend(
                currentSalesCount > 0 ? currentMetrics.revenue / currentSalesCount : 0,
                previousSalesCount > 0 ? previousMetrics.revenue / previousSalesCount : 0
            )
        },
        revenueTimeSeries,
        topProfitable,
        worstMargin
    };
};

async function fetchSalesCount(companyId: string, start: Date, end: Date): Promise<number> {
    const count = await db.sale.count({
        where: {
            companyId,
            status: SaleStatus.ACTIVE,
            date: { gte: start, lt: end }
        }
    });
    return count;
}

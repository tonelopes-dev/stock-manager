import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { 
  startOfDay, 
  endOfDay, 
  format,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
  subMonths
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export interface SalesAnalyticsDto {
    totalRevenue: { value: number; trend: number };
    totalProfit: { value: number; trend: number };
    averageTicket: { value: number; trend: number };
    totalSales: { value: number; trend: number };
    revenueTimeSeries: { date: string; revenue: number }[];
    monthlyComparison: {
        periodA: {
            name: string;
            revenue: number;
            salesCount: number;
            avgTicket: number;
        };
        periodB: {
            name: string;
            revenue: number;
            salesCount: number;
            avgTicket: number;
        };
    };
}

export const getSalesAnalytics = async (
    from?: string, 
    to?: string,
    monthA?: string, // Format: YYYY-MM
    monthB?: string
): Promise<SalesAnalyticsDto> => {
    const companyId = await getCurrentCompanyId();
    
    // 1. Define Intervals for Metrics (Selected Period vs Previous Identical Period)
    const now = new Date();
    
    const parseLocalDay = (dateStr: string) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    const startOfSelected = from ? startOfDay(parseLocalDay(from)) : startOfMonth(now);
    const endOfSelected = to ? endOfDay(parseLocalDay(to)) : endOfDay(now);
    
    const diff = endOfSelected.getTime() - startOfSelected.getTime();
    const startOfPrevious = new Date(startOfSelected.getTime() - diff - 1);
    const endOfPrevious = new Date(startOfSelected.getTime() - 1);

    // 2. Fetch Metrics
    const [currentMetrics, previousMetrics] = await Promise.all([
        fetchSalesMetrics(companyId, startOfSelected, endOfSelected),
        fetchSalesMetrics(companyId, startOfPrevious, endOfPrevious)
    ]);

    const calculateTrend = (current: number, previous: number) => {
        if (previous <= 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    // 3. Time Series for Selected Period
    const sales = await db.sale.findMany({
        where: {
            companyId,
            status: "ACTIVE",
            date: { gte: startOfSelected, lte: endOfSelected }
        },
        include: {
            saleItems: true
        }
    });

    const days = eachDayOfInterval({ start: startOfSelected, end: endOfSelected });
    const timeSeries = days.map(day => {
        const daySales = sales.filter(sale => isSameDay(sale.date, day));
        const dayRevenue = daySales.reduce((acc, sale) => {
            return acc + sale.saleItems.reduce((sum, si) => sum + (Number(si.unitPrice) * Number(si.quantity)), 0);
        }, 0);

        return {
            date: format(day, "dd/MM"),
            revenue: dayRevenue
        };
    });

    // 4. Monthly Comparison (Custom Months or Current vs Previous)
    const parseMonthStr = (str?: string, defaultDate: Date = now) => {
        if (!str) return { start: startOfMonth(defaultDate), end: endOfMonth(defaultDate) };
        const [year, month] = str.split("-").map(Number);
        const date = new Date(year, month - 1, 1);
        return { start: startOfMonth(date), end: endOfMonth(date) };
    };

    const { start: startA, end: endA } = parseMonthStr(monthA, now);
    const { start: startB, end: endB } = monthB ? parseMonthStr(monthB) : parseMonthStr(undefined, subMonths(now, 1));

    const [metricsA, metricsB] = await Promise.all([
        fetchSalesMetrics(companyId, startA, endA),
        fetchSalesMetrics(companyId, startB, endB)
    ]);

    const formatMonthLabel = (date: Date) => format(date, "MMMM yyyy", { locale: ptBR });

    return {
        totalRevenue: {
            value: currentMetrics.revenue,
            trend: calculateTrend(currentMetrics.revenue, previousMetrics.revenue)
        },
        totalProfit: {
            value: currentMetrics.revenue - currentMetrics.cost,
            trend: calculateTrend(currentMetrics.revenue - currentMetrics.cost, previousMetrics.revenue - previousMetrics.cost)
        },
        averageTicket: {
            value: currentMetrics.salesCount > 0 ? currentMetrics.revenue / currentMetrics.salesCount : 0,
            trend: calculateTrend(
                currentMetrics.salesCount > 0 ? currentMetrics.revenue / currentMetrics.salesCount : 0,
                previousMetrics.salesCount > 0 ? previousMetrics.revenue / previousMetrics.salesCount : 0
            )
        },
        totalSales: {
            value: currentMetrics.salesCount,
            trend: calculateTrend(currentMetrics.salesCount, previousMetrics.salesCount)
        },
        revenueTimeSeries: timeSeries,
        monthlyComparison: {
            periodA: {
                name: formatMonthLabel(startA),
                revenue: metricsA.revenue,
                salesCount: metricsA.salesCount,
                avgTicket: metricsA.salesCount > 0 ? metricsA.revenue / metricsA.salesCount : 0,
            },
            periodB: {
                name: formatMonthLabel(startB),
                revenue: metricsB.revenue,
                salesCount: metricsB.salesCount,
                avgTicket: metricsB.salesCount > 0 ? metricsB.revenue / metricsB.salesCount : 0,
            }
        }
    };
};

async function fetchSalesMetrics(companyId: string, start: Date, end: Date) {
    const totals = await db.$queryRaw<{ revenue: number; cost: number; salesCount: number }[]>`
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

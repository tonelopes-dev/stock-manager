import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { format } from "date-fns/format";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import { isSameDay } from "date-fns/isSameDay";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { subMonths } from "date-fns/subMonths";
import { addDays } from "date-fns/addDays";
import { startOfDay } from "date-fns/startOfDay";
import { ptBR } from "date-fns/locale/pt-BR";
import { parseLocalDay, getDefaultSalesRange } from "@/app/_lib/date";

export interface SalesAnalyticsDto {
    totalRevenue: {
        value: number;
        trend: number;
    };
    totalTips: {
        value: number;
        trend: number;
    };
    totalProfit: {
        value: number;
        trend: number;
    };
    averageTicket: {
        value: number;
        trend: number;
    };
    totalSales: {
        value: number;
        trend: number;
    };
    revenueTimeSeries: {
        date: string;
        revenue: number;
    }[];
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
    const { from: defaultFrom, to: defaultTo } = getDefaultSalesRange();

    const startOfSelected = from ? startOfDay(parseLocalDay(from)) : defaultFrom;
    const endOfSelected = to ? startOfDay(addDays(parseLocalDay(to), 1)) : addDays(defaultTo, 1);
    
    const diff = endOfSelected.getTime() - startOfSelected.getTime();
    const startOfPrevious = new Date(startOfSelected.getTime() - diff);
    const endOfPrevious = startOfSelected;

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

    const salesMap = new Map();
    sales.forEach(sale => {
        const key = new Date(sale.date).toISOString().split("T")[0];
        if (!salesMap.has(key)) salesMap.set(key, []);
        salesMap.get(key).push(sale);
    });

    const days = eachDayOfInterval({ start: startOfSelected, end: startOfSelected.getTime() > endOfSelected.getTime() ? startOfSelected : addDays(endOfSelected, -1) });
    const timeSeries = days.map(day => {
        const key = day.toISOString().split("T")[0];
        const daySales = salesMap.get(key) || [];
        const dayRevenue = daySales.reduce((acc: number, sale: any) => {
            return acc + sale.saleItems.reduce((sum: number, si: any) => sum + (Number(si.unitPrice) * Number(si.quantity)), 0);
        }, 0);

        return {
            date: format(day, "dd/MM"),
            revenue: dayRevenue
        };
    });

    // 4. Monthly Comparison (Custom Months or Current vs Previous)
    const now = new Date();
    const parseMonthStr = (str?: string, defaultDate: Date = now) => {
        if (!str) return { start: startOfMonth(defaultDate), end: startOfDay(addDays(endOfMonth(defaultDate), 1)) };
        const [year, month] = str.split("-").map(Number);
        const date = new Date(year, month - 1, 1);
        return { start: startOfMonth(date), end: startOfDay(addDays(endOfMonth(date), 1)) };
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
        totalTips: {
            value: currentMetrics.tips,
            trend: calculateTrend(currentMetrics.tips, previousMetrics.tips)
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
    const totals = await db.$queryRaw<{ revenue: number; cost: number; tips: number; salesCount: number }[]>`
        SELECT 
            COALESCE(SUM("unitPrice" * "quantity"), 0)::float as revenue,
            COALESCE(SUM(("baseCost" + "operationalCost") * "quantity"), 0)::float as cost,
            (SELECT COALESCE(SUM("tipAmount"), 0)::float FROM "Sale" WHERE "companyId" = ${companyId} AND "status" = 'ACTIVE' AND "date" >= ${start} AND "date" < ${end}) as tips,
            COUNT(DISTINCT "saleId")::int as "salesCount"
        FROM "SaleProduct"
        JOIN "Sale" ON "Sale"."id" = "SaleProduct"."saleId"
        WHERE "Sale"."companyId" = ${companyId}
            AND "Sale"."status"::text = 'ACTIVE'
            AND "Sale"."date" >= ${start}
            AND "Sale"."date" < ${end}
    `;

    return {
        revenue: totals[0].revenue,
        cost: totals[0].cost,
        tips: totals[0].tips,
        salesCount: totals[0].salesCount
    };
}

import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { startOfDay, endOfDay } from "date-fns";
import { parseLocalDay, nowBRT, todayBRT } from "@/app/_utils/date";

export interface AggregatedSaleDto {
  productId: string;
  productName: string;
  qtySold: number;
  currentStock: number;
  totalRevenue: number;
  totalCost: number;
}

export interface AggregatedSalesResponse {
  items: AggregatedSaleDto[];
  totalTips: number;
  totalRevenue: number;
}

export const getAggregatedSales = async (
  from?: string,
  to?: string
): Promise<AggregatedSalesResponse> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return { items: [], totalTips: 0, totalRevenue: 0 };

  const start = from ? new Date(from + "T00:00:00.000Z") : new Date(todayBRT() + "T00:00:00.000Z");
  const end = to ? new Date(to + "T23:59:59.999Z") : new Date(todayBRT() + "T23:59:59.999Z");

  // 1. Fetch Aggregated Sales by Product
  const itemsRaw = await db.$queryRaw<any[]>`
    SELECT 
        p.id as "productId",
        p.name as "productName",
        p.stock::float as "currentStock",
        SUM(si.quantity)::float as "qtySold",
        SUM(si."totalAmount")::float as "totalRevenue",
        SUM(si."totalCost")::float as "totalCost"
    FROM "SaleProduct" si
    JOIN "Product" p ON p.id = si."productId"
    JOIN "Sale" s ON s.id = si."saleId"
    WHERE s."companyId" = ${companyId}
      AND s.status = 'ACTIVE'
      AND s.date >= ${start}
      AND s.date <= ${end}
    GROUP BY p.id, p.name, p.stock
    ORDER BY "qtySold" DESC
  `;

  // 2. Fetch Total Tips and Overall Revenue in the period
  const totals = await db.sale.aggregate({
    _sum: {
      tipAmount: true,
      totalAmount: true,
    },
    where: {
      companyId,
      status: "ACTIVE",
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  return {
    items: itemsRaw.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      qtySold: item.qtySold,
      currentStock: item.currentStock,
      totalRevenue: item.totalRevenue,
      totalCost: item.totalCost,
    })),
    totalTips: Number(totals._sum.tipAmount || 0),
    totalRevenue: Number(totals._sum.totalAmount || 0),
  };
};

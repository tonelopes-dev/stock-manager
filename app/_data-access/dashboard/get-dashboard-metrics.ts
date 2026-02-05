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
  
  // 1. Fetch Today's Sales for Metrics
  const dailySales = await db.sale.findMany({
    where: {
      companyId,
      status: "ACTIVE",
      date: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
    include: {
      saleProducts: true,
    },
  });

  let dailyRevenue = 0;
  let dailyCost = 0;

  for (const sale of dailySales) {
    for (const item of sale.saleProducts) {
      dailyRevenue += Number(item.unitPrice) * item.quantity;
      dailyCost += Number(item.baseCost) * item.quantity;
    }
  }

  const dailyProfit = dailyRevenue - dailyCost;
  const averageTicket = dailySales.length > 0 ? dailyRevenue / dailySales.length : 0;

  // 2. Fetch Top Selling Products (All time or last 30 days - let's do top 5 all time active for now)
  const productPerformance = await db.product.findMany({
    where: { 
      companyId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      saleProducts: {
        where: {
          sale: {
            status: "ACTIVE"
          }
        },
        select: {
          quantity: true,
          unitPrice: true,
        },
      },
    },
  });

  const topSellingProducts = productPerformance
    .map((p) => {
      const quantitySold = p.saleProducts.reduce((acc, curr) => acc + curr.quantity, 0);
      const revenue = p.saleProducts.reduce((acc, curr) => acc + (Number(curr.unitPrice) * curr.quantity), 0);
      return { id: p.id, name: p.name, quantitySold, revenue };
    })
    .filter(p => p.quantitySold > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 3. Fetch Low Stock Products
  const lowStockProductsFromDb = await db.product.findMany({
    where: {
      companyId,
      isActive: true,
      stock: {
        lte: db.product.fields.minStock // Note: Prisma fields comparison might need raw query or handle in JS
      }
    },
    select: {
      id: true,
      name: true,
      stock: true,
      minStock: true,
    },
  });
  
  // Refined low stock query as Prisma doesn't support field vs field natively in 'where' easily without $where or raw
  const allActiveProducts = await db.product.findMany({
    where: { companyId, isActive: true },
    select: { id: true, name: true, stock: true, minStock: true }
  });

  const lowStockProducts = allActiveProducts
    .filter(p => p.stock <= p.minStock)
    .slice(0, 5);

  return {
    dailyRevenue,
    dailyProfit,
    averageTicket,
    topSellingProducts,
    lowStockProducts,
  };
};

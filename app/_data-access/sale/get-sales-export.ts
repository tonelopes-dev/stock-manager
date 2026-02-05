import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface SalesExportParams {
  from?: Date;
  to?: Date;
}

export const getSalesExport = async (params: SalesExportParams = {}) => {
  const companyId = await getCurrentCompanyId();
  
  const sales = await db.sale.findMany({
    where: {
      companyId,
      status: "ACTIVE",
      date: {
        gte: params.from,
        lte: params.to,
      },
    },
    include: {
      user: {
          select: { name: true, email: true }
      },
      saleProducts: {
        include: { product: true },
      },
    },
    orderBy: { date: "desc" },
  });

  // Flatten the data for CSV (one row per sale product)
  const rows: any[] = [];
  
  sales.forEach((sale) => {
    sale.saleProducts.forEach((sp) => {
      const unitPrice = Number(sp.unitPrice);
      const baseCost = Number(sp.baseCost);
      const revenue = unitPrice * sp.quantity;
      const totalCost = baseCost * sp.quantity;
      const margin = revenue - totalCost;
      const marginPercentage = revenue > 0 ? (margin / revenue) * 100 : 0;

      rows.push({
        Data: sale.date.toISOString().split('T')[0],
        Produto: sp.product.name,
        SKU: sp.product.sku || "-",
        Quantidade: sp.quantity,
        "Preço Unit.": unitPrice.toFixed(2),
        Receita: revenue.toFixed(2),
        "Custo Unit.": baseCost.toFixed(2),
        Lucro: margin.toFixed(2),
        "Margem %": marginPercentage.toFixed(2),
        "Responsável": sale.user?.name || sale.user?.email || "N/A",
      });
    });
  });

  return rows;
};

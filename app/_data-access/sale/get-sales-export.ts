import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export interface SalesExportParams {
  from?: Date;
  to?: Date;
}

export const getSalesExport = async (params: SalesExportParams = {}) => {
  const companyId = await getCurrentCompanyId();
  
  interface SaleWithItems {
    id: string;
    date: Date;
    saleItems: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unitPrice: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        baseCost: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quantity: any;
        product: { name: string; sku: string | null };
    }[];
    user?: { name: string | null; email: string | null } | null;
  }

  const rawSales = await db.sale.findMany({
    where: {
      companyId,
      status: "ACTIVE",
      date: {
        gte: params.from,
        lte: params.to,
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    include: {
      user: {
          select: { name: true, email: true }
      },
      saleItems: {
        include: { product: true },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    orderBy: { date: "desc" },
  });

  const sales = rawSales as unknown as SaleWithItems[];

  interface SalesExportRow {
    Data: string;
    Produto: string;
    SKU: string;
    Quantidade: number;
    "Preço Unit.": string;
    Receita: string;
    "Custo Unit.": string;
    Lucro: string;
    "Margem %": string;
    Responsável: string;
  }

  const rows: SalesExportRow[] = [];
  
  sales.forEach((sale) => {
    const items = sale.saleItems || [];
    
    items.forEach((sp) => {
      const unitPrice = Number(sp.unitPrice);
      const baseCost = Number(sp.baseCost);
      const quantity = Number(sp.quantity);
      const revenue = unitPrice * quantity;
      const totalCost = baseCost * quantity;
      const margin = revenue - totalCost;
      const marginPercentage = revenue > 0 ? (margin / revenue) * 100 : 0;

      rows.push({
        Data: sale.date.toISOString().split('T')[0],
        Produto: sp.product.name,
        SKU: sp.product.sku || "-",
        Quantidade: quantity,
        "Preço Unit.": unitPrice.toFixed(2),
        Receita: revenue.toFixed(2),
        "Custo Unit.": baseCost.toFixed(2),
        Lucro: margin.toFixed(2),
        "Margem %": marginPercentage.toFixed(2),
        Responsável: sale.user?.name || sale.user?.email || "N/A",
      });
    });
  });

  return rows;
};

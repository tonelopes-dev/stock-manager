import { db } from "@/app/_lib/prisma";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/app/_lib/utils";
import { Prisma } from "@prisma/client";

interface ExportSalesParams {
  companyId: string;
  from?: Date;
  to?: Date;
  periods?: { month: number; year: number }[];
}

export const ExportService = {
  async generateSalesXlsx({ companyId, from, to }: ExportSalesParams) {
    const whereClause: Prisma.SaleWhereInput = {
      companyId,
      status: "ACTIVE",
      date: {
        gte: from,
        lte: to,
      },
    };

    const sales = await db.sale.findMany({
      where: whereClause,
      include: {
        customer: true,
        user: true,
        saleItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: "asc", 
      },
    });

    // --- WORKBOOK INITIALIZATION ---
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Kipo";
    workbook.lastModifiedBy = "Kipo";
    workbook.created = new Date();
    workbook.modified = new Date();

    // --- TAB 1: RESUMO EXECUTIVO ---
    const summarySheet = workbook.addWorksheet("Resumo Executivo", { views: [{ showGridLines: false }] });

    const totalRev = sales.reduce((acc, sale) => {
      return acc + sale.saleItems.reduce((sum, si) => sum + Number(si.unitPrice) * Number(si.quantity), 0);
    }, 0);
    const totalTips = sales.reduce((acc, sale) => acc + Number(sale.tipAmount || 0), 0);
    const totalS = sales.length;

    // Header styling
    summarySheet.mergeCells("A1:K4");
    summarySheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } };
    summarySheet.getCell("B2").value = "KIPO | RELATÓRIO OPERACIONAL";
    summarySheet.getCell("B2").font = { name: "Segoe UI", size: 20, bold: true, color: { argb: "FFFFFFFF" } };
    summarySheet.getCell("B3").value = `Período: ${from ? format(from, "dd/MM/yyyy") : ""} até ${to ? format(to, "dd/MM/yyyy") : ""} | Gerado em: ${format(new Date(), "PPpp", { locale: ptBR })}`;
    summarySheet.getCell("B3").font = { size: 10, color: { argb: "FFFFFFFF" } };

    // KPI Cards
    const kpis = [
      { label: "FATURAMENTO PRODUTOS", value: totalRev, col: 2, color: "FF10B981" },
      { label: "TOTAL GORJETAS", value: totalTips, col: 5, color: "FF059669" },
      { label: "QUANTIDADE DE VENDAS", value: totalS, col: 8, color: "FF3B82F6" },
    ];

    kpis.forEach((kpi) => {
      const colLetter = summarySheet.getColumn(kpi.col).letter;
      const nextColLetter = summarySheet.getColumn(kpi.col + 1).letter;
      const cell = summarySheet.getCell(`${colLetter}6`);
      
      summarySheet.mergeCells(`${colLetter}6:${nextColLetter}9`);

      cell.value = {
        richText: [
          { text: `${kpi.label}\n`, font: { size: 10, bold: true, color: { argb: "FF64748B" } } },
          { text: kpi.label.includes("QUANTIDADE") ? kpi.value.toString() : formatCurrency(kpi.value), font: { size: 18, bold: true, color: { argb: "FF1E293B" } } }
        ]
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "medium", color: { argb: kpi.color } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      
      summarySheet.getColumn(kpi.col).width = 15;
      summarySheet.getColumn(kpi.col+1).width = 15;
    });

    // --- TAB 2: MOVIMENTAÇÃO POR PRODUTO (AGGREGATED) ---
    const aggregatedSheet = workbook.addWorksheet("Movimentação de Produtos", { 
      views: [{ state: "frozen", ySplit: 1 }] 
    });

    // Aggregation Logic
    const productMap: Record<string, { name: string; qty: number; revenue: number; stock: number }> = {};
    sales.forEach(sale => {
      sale.saleItems.forEach(si => {
        if (!productMap[si.productId]) {
          productMap[si.productId] = {
            name: si.product.name,
            qty: 0,
            revenue: 0,
            stock: Number(si.product.stock),
          };
        }
        productMap[si.productId].qty += Number(si.quantity);
        productMap[si.productId].revenue += Number(si.unitPrice) * Number(si.quantity);
      });
    });

    aggregatedSheet.columns = [
      { header: "PRODUTO", key: "name", width: 40 },
      { header: "QTD VENDIDA", key: "qty", width: 15 },
      { header: "FATURAMENTO", key: "revenue", width: 20 },
      { header: "ESTOQUE ATUAL", key: "stock", width: 15 },
    ];

    aggregatedSheet.getRow(1).eachCell(c => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
      c.alignment = { horizontal: "center", vertical: "middle" };
    });

    Object.values(productMap)
      .sort((a, b) => b.qty - a.qty)
      .forEach((p) => {
        const row = aggregatedSheet.addRow({
          name: p.name.toUpperCase(),
          qty: p.qty,
          revenue: p.revenue,
          stock: p.stock,
        });
        row.getCell("revenue").numFmt = '"R$" #,##0.00';
        
        if (row.number % 2 === 0) {
          row.eachCell(cell => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          });
        }
        row.eachCell(cell => {
          cell.alignment = { vertical: "middle", horizontal: cell.address.includes("A") ? "left" : "right" };
        });
    });

    aggregatedSheet.autoFilter = "A1:D1";

    // --- TAB 3: VENDAS DETALHADAS ---
    const detailedSheet = workbook.addWorksheet("Lista de Comandas", { views: [{ state: "frozen", ySplit: 1 }] });
    
    detailedSheet.columns = [
      { header: "PESSOA", key: "person", width: 25 },
      { header: "DATA/HORA", key: "date", width: 20 },
      { header: "TOTAL", key: "total", width: 18 },
      { header: "GORJETA", key: "tip", width: 15 },
      { header: "PRODUTOS", key: "products", width: 50 },
    ];

    detailedSheet.getRow(1).eachCell(c => {
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF64748B" } };
        c.alignment = { horizontal: "center", vertical: "middle" };
    });

    sales.forEach((sale) => {
        const row = detailedSheet.addRow({
          person: sale.customer?.name || sale.user?.name || "AVULSO",
          date: sale.date,
          total: Number(sale.totalAmount),
          tip: Number(sale.tipAmount),
          products: sale.saleItems.map(si => `${si.product.name} (x${si.quantity})`).join(", "),
        });
        row.getCell("total").numFmt = '"R$" #,##0.00';
        row.getCell("tip").numFmt = '"R$" #,##0.00';
        row.getCell("date").numFmt = "dd/mm/yyyy hh:mm";
        
        if (row.number % 2 === 0) {
          row.eachCell(cell => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          });
        }
    });

    return await workbook.xlsx.writeBuffer();
  },
};

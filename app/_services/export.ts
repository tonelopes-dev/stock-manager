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
  async generateSalesXlsx({ companyId, from, to, periods }: ExportSalesParams) {
    const whereClause: Prisma.SaleWhereInput = {
      companyId,
      status: "ACTIVE",
    };

    if (periods && periods.length > 0) {
      whereClause.OR = periods.map((p) => ({
        date: {
          gte: new Date(p.year, p.month - 1, 1),
          lte: new Date(p.year, p.month, 0, 23, 59, 59),
        },
      }));
    } else {
      whereClause.date = {
        gte: from,
        lte: to,
      };
    }

    const sales = await db.sale.findMany({
      where: whereClause,
      include: {
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

    // --- AGGREGAÇÃO PARA COMPARATIVO MENSAL ---
    const monthlyData: Record<string, { 
      label: string; 
      revenue: number; 
      salesCount: number; 
      avgTicket: number;
      month: number;
      year: number;
    }> = {};

    sales.forEach((sale) => {
      const month = sale.date.getMonth() + 1;
      const year = sale.date.getFullYear();
      const key = `${month}-${year}`;
      const saleTotal = sale.saleItems.reduce((sum, si) => sum + Number(si.unitPrice) * Number(si.quantity), 0);

      if (!monthlyData[key]) {
        monthlyData[key] = {
          label: format(sale.date, "MMM/yyyy", { locale: ptBR }),
          revenue: 0,
          salesCount: 0,
          avgTicket: 0,
          month,
          year,
        };
      }

      monthlyData[key].revenue += saleTotal;
      monthlyData[key].salesCount += 1;
    });

    const sortedMonthlyData = Object.values(monthlyData)
      .map(data => ({
        ...data,
        avgTicket: data.salesCount > 0 ? data.revenue / data.salesCount : 0
      }))
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

    const comparisonData = sortedMonthlyData.map((data, index) => {
      const prev = index > 0 ? sortedMonthlyData[index - 1] : null;
      const delta = prev ? data.revenue - prev.revenue : 0;
      const growth = prev && prev.revenue > 0 ? (delta / prev.revenue) : 0;

      return { ...data, delta, growth };
    });

    // --- WORKBOOK INITIALIZATION (Pure Code) ---
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Stockly";
    workbook.lastModifiedBy = "Stockly";
    workbook.created = new Date();
    workbook.modified = new Date();

    // --- TAB 1: RESUMO EXECUTIVO ---
    const summarySheet = workbook.addWorksheet("Resumo Executivo", { views: [{ showGridLines: false }] });

    const totalRev = sales.reduce((acc, sale) => {
      return acc + sale.saleItems.reduce((sum, si) => sum + Number(si.unitPrice) * Number(si.quantity), 0);
    }, 0);
    const totalS = sales.length;
    const avgT = totalS > 0 ? totalRev / totalS : 0;

    // Header styling
    summarySheet.mergeCells("A1:K4");
    summarySheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    summarySheet.getCell("B2").value = "STOCKLY | RELATÓRIO EXECUTIVO";
    summarySheet.getCell("B2").font = { name: "Segoe UI", size: 20, bold: true, color: { argb: "FFFFFFFF" } };
    summarySheet.getCell("B3").value = `Relatório Consolidado | Gerado em: ${format(new Date(), "PPpp", { locale: ptBR })}`;
    summarySheet.getCell("B3").font = { size: 10, color: { argb: "FF94A3B8" } };

    // KPI Cards
    const kpis = [
      { label: "FATURAMENTO TOTAL", value: totalRev, col: 2, color: "FF10B981" },
      { label: "QUANTIDADE DE VENDAS", value: totalS, col: 5, color: "FF3B82F6" },
      { label: "TICKET MÉDIO", value: avgT, col: 8, color: "FFF59E0B" },
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

    // --- TAB 2: COMPARATIVO MENSAL (IF > 1 PERIOD) ---
    if (comparisonData.length > 1) {
      const compSheet = workbook.addWorksheet("Comparativo Mensal", { 
        views: [{ showGridLines: false, state: "frozen", ySplit: 4 }] 
      });

      // Title
      compSheet.mergeCells("B2:G2");
      const subTitleCell = compSheet.getCell("B2");
      subTitleCell.value = "ANÁLISE COMPARATIVA DE DESEMPENHO";
      subTitleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FF1E293B" } };
      subTitleCell.alignment = { horizontal: "center", vertical: "middle" };

      // Header
      const hRow = compSheet.getRow(4);
      hRow.height = 25;
      const compCols = ["MÊS/ANO", "FATURAMENTO TOTAL", "QUANTIDADE VENDAS", "TICKET MÉDIO", "DELTA MÊS ANT.", "CRESCIMENTO %"];
      compCols.forEach((c, i) => {
        const cell = hRow.getCell(i + 2);
        cell.value = c;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        compSheet.getColumn(i + 2).width = i === 0 ? 15 : 22;
      });

      // Data Rows
      comparisonData.forEach((d, i) => {
        const r = compSheet.getRow(i + 5);
        r.height = 22;
        r.getCell(2).value = d.label.toUpperCase();
        r.getCell(3).value = d.revenue;
        r.getCell(4).value = d.salesCount;
        r.getCell(5).value = d.avgTicket;
        r.getCell(6).value = d.delta;
        r.getCell(7).value = d.growth;
        
        r.getCell(3).numFmt = '"R$" #,##0.00';
        r.getCell(5).numFmt = '"R$" #,##0.00';
        r.getCell(6).numFmt = '"R$" #,##0.00';
        r.getCell(7).numFmt = "0.00%";
        
        if (d.growth > 0) r.getCell(7).font = { color: { argb: "FF059669" }, bold: true };
        else if (d.growth < 0) r.getCell(7).font = { color: { argb: "FFDC2626" }, bold: true };
        
        if (r.number % 2 === 0) {
          for (let col = 2; col <= 7; col++) {
            r.getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
          }
        }
        
        r.eachCell(cell => {
           cell.alignment = { vertical: "middle", horizontal: cell.address.includes("B") ? "center" : "right" };
        });
      });
      
      compSheet.autoFilter = "B4:G4";
    }

    // --- TAB 3: VENDAS DETALHADAS ---
    const detailedSheet = workbook.addWorksheet("Vendas Detalhadas", { views: [{ state: "frozen", ySplit: 1 }] });
    
    detailedSheet.columns = [
      { header: "DATA", key: "date", width: 15 },
      { header: "PRODUTO", key: "product", width: 35 },
      { header: "QTD", key: "quantity", width: 10 },
      { header: "VALOR UNIT.", key: "unitPrice", width: 18 },
      { header: "VALOR TOTAL", key: "totalPrice", width: 18 },
      { header: "LUCRO BRUTO", key: "profit", width: 18 },
    ];

    detailedSheet.getRow(1).eachCell(c => {
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
        c.alignment = { horizontal: "center", vertical: "middle" };
    });

    sales.forEach((sale) => {
      sale.saleItems.forEach((si) => {
        const row = detailedSheet.addRow({
          date: sale.date,
          product: si.product.name,
          quantity: Number(si.quantity),
          unitPrice: Number(si.unitPrice),
          totalPrice: Number(si.unitPrice) * Number(si.quantity),
          profit: (Number(si.unitPrice) - Number(si.baseCost)) * Number(si.quantity),
        });
        row.getCell("unitPrice").numFmt = '"R$" #,##0.00';
        row.getCell("totalPrice").numFmt = '"R$" #,##0.00';
        row.getCell("profit").numFmt = '"R$" #,##0.00';
        row.getCell("date").numFmt = "dd/mm/yyyy";
        
        if (row.number % 2 === 0) {
          row.eachCell(cell => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          });
        }
      });
    });
    
    detailedSheet.autoFilter = "A1:F1";

    return await workbook.xlsx.writeBuffer();
  },
};

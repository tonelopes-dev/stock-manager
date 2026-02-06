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
        saleProducts: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Stockly";
    workbook.lastModifiedBy = "Stockly";
    workbook.created = new Date();
    workbook.modified = new Date();

    // --- TAB 1: RESUMO EXECUTIVO ---
    const summarySheet = workbook.addWorksheet("Resumo Executivo", {
      views: [{ showGridLines: false }],
    });

    // Cálculos
    const totalRevenue = sales.reduce((acc, sale) => {
      const saleTotal = sale.saleProducts.reduce((sum, sp) => {
        return sum + Number(sp.unitPrice) * sp.quantity;
      }, 0);
      return acc + saleTotal;
    }, 0);

    const totalSales = sales.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // --- ESTILIZAÇÃO DO DASHBOARD ---
    
    // Background Header
    summarySheet.mergeCells("A1:K4");
    summarySheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" }, // Slate 800
    };

    // Título Principal
    summarySheet.getCell("B2").value = "STOCKLY | RELATÓRIO EXECUTIVO";
    summarySheet.getCell("B2").font = {
      name: "Segoe UI",
      size: 20,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    summarySheet.getCell("B2").alignment = { vertical: "middle", horizontal: "left" };

    summarySheet.getCell("B3").value = `Período: Todas as Vendas | Gerado em: ${format(new Date(), "PPpp", { locale: ptBR })}`;
    summarySheet.getCell("B3").font = { size: 10, color: { argb: "94A3B8" } }; // Slate 400
    summarySheet.getCell("B3").alignment = { vertical: "middle", horizontal: "left" };

    // KPI Cards Configuration
    const kpiCards = [
      { label: "FATURAMENTO TOTAL", value: totalRevenue, color: "FF10B981", icon: "R$" },
      { label: "QUANTIDADE DE VENDAS", value: totalSales, color: "FF3B82F6", icon: "Qty" },
      { label: "TICKET MÉDIO", value: averageTicket, color: "FFF59E0B", icon: "Avg" },
    ];

    let startCol = 2; // Column B
    kpiCards.forEach((kpi) => {
      const colLetter = summarySheet.getColumn(startCol).letter;
      const nextColLetter = summarySheet.getColumn(startCol + 1).letter;
      
      const cardRange = `${colLetter}6:${nextColLetter}9`;
      summarySheet.mergeCells(cardRange);
      
      const cell = summarySheet.getCell(`${colLetter}6`);
      cell.value = {
        richText: [
          { text: `${kpi.label}\n`, font: { size: 10, bold: true, color: { argb: "FF64748B" } } },
          { text: kpi.label.includes("QUANTIDADE") ? kpi.value.toString() : formatCurrency(kpi.value), font: { size: 18, bold: true, color: { argb: "FF1E293B" } } }
        ]
      };
      
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "medium", color: { argb: kpi.color } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      summarySheet.getColumn(startCol).width = 15;
      summarySheet.getColumn(startCol + 1).width = 15;
      startCol += 3; // Gap of 1 column
    });

    // --- TAB 2: VENDAS DETALHADAS ---
    const detailedSheet = workbook.addWorksheet("Vendas Detalhadas", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    const columns = [
      { header: "DATA", key: "date", width: 15 },
      { header: "PRODUTO", key: "product", width: 35 },
      { header: "QTD", key: "quantity", width: 10 },
      { header: "VALOR UNIT.", key: "unitPrice", width: 18 },
      { header: "VALOR TOTAL", key: "totalPrice", width: 18 },
      { header: "LUCRO BRUTO", key: "profit", width: 18 },
    ];

    detailedSheet.columns = columns;

    // Header Styles (Modern Dark look)
    const headerRow = detailedSheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E293B" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Data Rows
    sales.forEach((sale) => {
      sale.saleProducts.forEach((sp) => {
        const row = detailedSheet.addRow({
          date: sale.date,
          product: sp.product.name,
          quantity: sp.quantity,
          unitPrice: Number(sp.unitPrice),
          totalPrice: Number(sp.unitPrice) * sp.quantity,
          profit: (Number(sp.unitPrice) - Number(sp.baseCost)) * sp.quantity,
        });

        row.height = 25;
        row.getCell("unitPrice").numFmt = '"R$" #,##0.00';
        row.getCell("totalPrice").numFmt = '"R$" #,##0.00';
        row.getCell("profit").numFmt = '"R$" #,##0.00';
        row.getCell("date").numFmt = "dd/mm/yyyy";
        row.getCell("quantity").alignment = { horizontal: "center" };

        // Zebra Striping
        if (row.number % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF8FAFC" },
            };
          });
        }
      });
    });

    // AutoFilter
    detailedSheet.autoFilter = `A1:${detailedSheet.getColumn(columns.length).letter}1`;

    return await workbook.xlsx.writeBuffer();
  },
};

import { NextRequest, NextResponse } from "next/server";
import { getSalesExport } from "@/app/_data-access/sale/get-sales-export";
import { auth } from "@/app/_lib/auth";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const from = fromStr ? new Date(fromStr) : undefined;
  const to = toStr ? new Date(toStr) : undefined;

  const data = await getSalesExport({ from, to });

  if (data.length === 0) {
      // Return empty CSV with header if no data
      const headers = ["Data", "Produto", "SKU", "Quantidade", "Preço Unit.", "Receita", "Custo Unit.", "Lucro", "Margem %", "Responsável"];
      const emptyCsv = headers.join(",") + "\n";
      return new NextResponse(emptyCsv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=vendas-vazio.csv`,
          },
        });
  }

  // Generate CSV string
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and commas
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        })
        .join(",")
    ),
  ];
  const csvString = "\ufeff" + csvRows.join("\n"); // Add BOM for Excel UTF-8 support

  const filename = `vendas-${format(new Date(), "yyyy-MM-dd-HH-mm")}.csv`;

  return new NextResponse(csvString, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  });
}

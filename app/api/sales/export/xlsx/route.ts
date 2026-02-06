import { auth } from "@/app/_lib/auth";
import { ExportService } from "@/app/_services/export";
import { format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const pStr = searchParams.getAll("p"); // Expected format: MM-YYYY

  const from = fromStr ? new Date(fromStr) : undefined;
  const to = toStr ? new Date(toStr) : undefined;
  
  const periods = pStr.map((p) => {
    const [month, year] = p.split("-").map(Number);
    return { month, year };
  });

  try {
    const buffer = await ExportService.generateSalesXlsx({
      companyId: session.user.companyId,
      from,
      to,
      periods,
    });

    const filename = `relatorio-vendas-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error("[XLSX_EXPORT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

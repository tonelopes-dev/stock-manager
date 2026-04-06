import { auth } from "@/app/_lib/auth";
import { ExportService } from "@/app/_services/export";
import { format, startOfDay, endOfDay } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.companyId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  // Timezone safe dates for query
  const from = fromStr ? startOfDay(new Date(fromStr + "T00:00:00")) : startOfDay(new Date());
  const to = toStr ? endOfDay(new Date(toStr + "T23:59:59")) : endOfDay(new Date());

  try {
    const buffer = await ExportService.generateSalesXlsx({
      companyId: session.user.companyId,
      from,
      to,
    });

    const filename = `relatorio-vendas-operacional-${format(from, "yyyy-MM-dd")}-a-${format(to, "yyyy-MM-dd")}.xlsx`;

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

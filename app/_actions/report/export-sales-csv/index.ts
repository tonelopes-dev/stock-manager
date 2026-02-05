"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { actionClient } from "@/app/_lib/safe-action";
import { salesReportSchema } from "@/app/_data-access/report/schema";

export const exportSalesCsv = actionClient
  .schema(salesReportSchema)
  .action(async ({ parsedInput: { from, to } }) => {
    const companyId = await getCurrentCompanyId();

    const sales = await db.sale.findMany({
      where: {
        companyId,
        status: "ACTIVE",
        date: {
          gte: from,
          lte: to,
        },
      },
      include: {
        saleProducts: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const headers = ["Data", "Produto", "Quantidade", "Receita", "Custo", "Lucro"];
    const rows = sales.flatMap((sale) =>
      sale.saleProducts.map((item) => {
        const revenue = Number(item.unitPrice) * item.quantity;
        const cost = Number(item.baseCost) * item.quantity;
        const profit = revenue - cost;

        return [
          sale.date.toLocaleDateString("pt-BR"),
          item.product.name,
          item.quantity.toString(),
          revenue.toFixed(2).replace(".", ","),
          cost.toFixed(2).replace(".", ","),
          profit.toFixed(2).replace(".", ","),
        ];
      })
    );

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
    ].join("\n");

    return { csv: csvContent };
  });

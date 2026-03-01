import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

import { startOfDay, endOfDay } from "date-fns";
import { parseLocalDay, getDefaultSalesRange } from "@/app/_lib/date";

export const getSales = async (params: GetSalesParams = {}): Promise<{ data: SaleDto[], total: number }> => {
  const { page = 1, pageSize = 10 } = params;
  const skip = (page - 1) * pageSize;

  const companyId = await getCurrentCompanyId();

  const { from: defaultFrom, to: defaultTo } = getDefaultSalesRange();

  const where = {
    companyId,
    date: {
        gte: params.from ? startOfDay(parseLocalDay(params.from)) : defaultFrom,
        lte: params.to ? endOfDay(parseLocalDay(params.to)) : endOfDay(defaultTo),
    }
  };


  const [sales, total] = await Promise.all([
    db.sale.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        date: "desc",
      },
      include: {
        saleItems: {
          include: { product: true },
        },
      },
    }),
    db.sale.count({ where })
  ]);

  const data = JSON.parse(
    JSON.stringify(
      sales.map((sale) => ({
        id: sale.id,
        date: sale.date,
        productNames: sale.saleItems
          .map((si) => si.product.name)
          .join(" • "),
        totalAmount: sale.saleItems.reduce(
          (acc, si) =>
            acc + Number(si.quantity) * Number(si.unitPrice),
          0,
        ),
        totalProducts: sale.saleItems.reduce(
          (acc, si) => acc + Number(si.quantity),
          0,
        ),
        saleItems: sale.saleItems.map(
          (si): SaleProductDto => ({
            productId: si.productId,
            productName: si.product.name,
            quantity: Number(si.quantity),
            unitPrice: Number(si.unitPrice),
          }),
        ),
      })),
    ),
  );

  return { data, total };
};
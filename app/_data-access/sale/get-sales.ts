import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

import { startOfDay, endOfDay } from "date-fns";

interface SaleProductDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  productName: string;
}

export interface SaleDto {
  id: string;
  productNames: string;
  totalProducts: number;
  totalAmount: number;
  date: Date;
  saleProducts: SaleProductDto[];
}

export interface GetSalesParams {
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
}

const parseLocalDay = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
};

export const getSales = async (params: GetSalesParams = {}): Promise<{ data: SaleDto[], total: number }> => {
  const { page = 1, pageSize = 10 } = params;
  const skip = (page - 1) * pageSize;

  const companyId = await getCurrentCompanyId();

  const where = {
    companyId,
    date: {
        gte: params.from ? startOfDay(parseLocalDay(params.from)) : undefined,
        lte: params.to ? endOfDay(parseLocalDay(params.to)) : undefined,
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
        saleProducts: {
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
        productNames: sale.saleProducts
          .map((saleProduct) => saleProduct.product.name)
          .join(" • "),
        totalAmount: sale.saleProducts.reduce(
          (acc, saleProduct) =>
            acc + saleProduct.quantity * Number(saleProduct.unitPrice),
          0,
        ),
        totalProducts: sale.saleProducts.reduce(
          (acc, saleProduct) => acc + saleProduct.quantity,
          0,
        ),
        saleProducts: sale.saleProducts.map(
          (saleProduct): SaleProductDto => ({
            productId: saleProduct.productId,
            productName: saleProduct.product.name,
            quantity: saleProduct.quantity,
            unitPrice: Number(saleProduct.unitPrice),
          }),
        ),
      })),
    ),
  );

  return { data, total };
};
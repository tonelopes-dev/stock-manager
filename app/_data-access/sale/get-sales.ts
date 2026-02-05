import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

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
}

export const getSales = async (params: GetSalesParams = {}): Promise<SaleDto[]> => {
  const companyId = await getCurrentCompanyId();
  const sales = await db.sale.findMany({
    where: { 
        companyId,
        date: {
            gte: params.from ? new Date(params.from) : undefined,
            lte: params.to ? new Date(params.to) : undefined,
        }
    },
    include: {
      saleProducts: {
        include: { product: true },
      },
    },
  });
  return JSON.parse(
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
};
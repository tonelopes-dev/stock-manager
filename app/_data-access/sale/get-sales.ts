import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { SaleStatus, SaleItem, Product, Prisma } from "@prisma/client";

export interface SaleItemDto extends SaleItem {
  product: Pick<Product, "name">;
}

export interface SaleDto {
  id: string;
  date: Date;
  totalAmount: number;
  totalCost: number;
  status: SaleStatus;
  productNames: string;
  totalProducts: number;
  customerName: string | null;
  customerId: string | null;
  saleItems: SaleItemDto[];
}

interface GetSalesParams {
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export const getSales = async ({
  from,
  to,
  page,
  pageSize,
}: GetSalesParams): Promise<{ data: SaleDto[]; total: number }> => {
  const companyId = await getCurrentCompanyId();

  const where: Prisma.SaleWhereInput = {
    companyId,
  };

  if (from && to) {
    where.date = {
      gte: new Date(from),
      lte: new Date(to),
    };
  }

  const [sales, total] = await Promise.all([
    db.sale.findMany({
      where,
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.sale.count({ where }),
  ]);

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: (sales as any[]).map((sale) => ({
      id: sale.id,
      date: sale.date,
      totalAmount: Number(sale.totalAmount),
      totalCost: Number(sale.totalCost),
      status: sale.status,
      productNames: sale.saleItems
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.product.name)
        .join(", "),
      totalProducts: sale.saleItems.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (acc: number, item: any) => acc + Number(item.quantity),
        0,
      ),
      customerName: sale.customer?.name || null,
      customerId: sale.customerId,
      saleItems: sale.saleItems as SaleItemDto[],
    })),
    total,
  };
};
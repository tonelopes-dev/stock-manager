import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { SaleStatus, SaleItem, Product, Prisma, PaymentMethod } from "@prisma/client";

export interface SaleItemDto extends Omit<SaleItem, "operationalCost" | "baseCost"> {
  operationalCost: number;
  baseCost: number;
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
  paymentMethod: PaymentMethod | null;
  tipAmount: number;
  discountAmount: number;
  extraAmount: number;
  adjustmentReason: string | null;
  isEmployeeSale: boolean;
  saleItems: SaleItemDto[];
}

interface GetSalesParams {
  from?: string;
  to?: string;
  query?: string;
  page: number;
  pageSize: number;
}

export const getSales = async ({
  from,
  to,
  query,
  page,
  pageSize,
}: GetSalesParams): Promise<{ data: SaleDto[]; total: number }> => {
  const companyId = await getCurrentCompanyId();

  const where: Prisma.SaleWhereInput = {
    companyId,
    status: SaleStatus.ACTIVE,
  };

  if (query) {
    where.OR = [
      {
        customer: {
          name: { contains: query, mode: "insensitive" },
        },
      },
      {
        customer: {
          email: { contains: query, mode: "insensitive" },
        },
      },
      {
        customer: {
          phone: { contains: query, mode: "insensitive" },
        },
      },
    ];
  }
    
  if (from || to) {
    where.date = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to + "T23:59:59.999Z") }),
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
      paymentMethod: sale.paymentMethod,
      tipAmount: Number(sale.tipAmount),
      discountAmount: Number(sale.discountAmount || 0),
      extraAmount: Number((sale as any).extraAmount || 0),
      adjustmentReason: (sale as any).adjustmentReason || null,
      isEmployeeSale: (sale as any).isEmployeeSale || false,
      saleItems: sale.saleItems.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        baseCost: Number(item.baseCost || 0),
        operationalCost: Number(item.operationalCost || 0),
        quantity: Number(item.quantity),
        discountAmount: Number(item.discountAmount || 0),
        totalAmount: Number(item.totalAmount || 0),
        totalCost: Number(item.totalCost || 0),
      })) as SaleItemDto[],
    })),
    total,
  };
};

export const getSaleById = async (id: string): Promise<SaleDto | null> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return null;

  const sale = await db.sale.findUnique({
    where: {
      id,
      companyId,
    },
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
  });

  if (!sale) return null;

  return {
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
      (acc: number, item: any) => acc + Number(item.quantity),
      0,
    ),
    customerName: sale.customer?.name || null,
    customerId: sale.customerId,
    paymentMethod: sale.paymentMethod,
    tipAmount: Number(sale.tipAmount),
    discountAmount: Number(sale.discountAmount || 0),
    extraAmount: Number((sale as any).extraAmount || 0),
    adjustmentReason: (sale as any).adjustmentReason || null,
    isEmployeeSale: (sale as any).isEmployeeSale || false,
    saleItems: sale.saleItems.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      baseCost: Number(item.baseCost || 0),
      operationalCost: Number(item.operationalCost || 0),
      quantity: Number(item.quantity),
      discountAmount: Number(item.discountAmount || 0),
      totalAmount: Number(item.totalAmount || 0),
      totalCost: Number(item.totalCost || 0),
    })) as SaleItemDto[],
  };
};
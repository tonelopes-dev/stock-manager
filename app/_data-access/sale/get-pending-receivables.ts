import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { PaymentMethod, SaleStatus } from "@prisma/client";

export interface ReceivableDto {
  id: string;
  date: Date;
  dueDate: Date | null;
  totalAmount: number;
  tipAmount: number;
  discountAmount: number;
  extraAmount: number;
  adjustmentReason: string | null;
  isEmployeeSale: boolean;
  paymentMethod: PaymentMethod | null;
  customerName: string;
  customerPhone: string | null;
  customerId: string | null;
  customerImageUrl: string | null;
  productNames: string;
  status: SaleStatus;
  saleItems: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    baseCost: number;
    operationalCost: number;
    product: {
      name: string;
    };
  }[];
}

export const getPendingReceivables = async (): Promise<ReceivableDto[]> => {
  const companyId = await getCurrentCompanyId();

  const sales = await db.sale.findMany({
    where: {
      companyId,
      status: "PENDING_PAYMENT",
    },
    select: {
      id: true,
      date: true,
      dueDate: true,
      totalAmount: true,
      tipAmount: true,
      discountAmount: true,
      extraAmount: true,
      adjustmentReason: true,
      isEmployeeSale: true,
      paymentMethod: true,
      status: true,
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          imageUrl: true,
        },
      },
      saleItems: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          unitPrice: true,
          baseCost: true,
          operationalCost: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return sales.map((sale) => ({
    id: sale.id,
    date: sale.date,
    dueDate: sale.dueDate,
    totalAmount: Number(sale.totalAmount),
    tipAmount: Number(sale.tipAmount),
    discountAmount: Number(sale.discountAmount || 0),
    extraAmount: Number(sale.extraAmount || 0),
    adjustmentReason: sale.adjustmentReason,
    isEmployeeSale: sale.isEmployeeSale,
    paymentMethod: sale.paymentMethod,
    customerName: sale.customer?.name || "Cliente Desconhecido",
    customerPhone: sale.customer?.phone || null,
    customerId: sale.customer?.id || null,
    customerImageUrl: sale.customer?.imageUrl || null,
    productNames: sale.saleItems.map((item) => `${item.quantity}x ${item.product.name}`).join(", "),
    status: sale.status,
    saleItems: sale.saleItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      baseCost: Number(item.baseCost || 0),
      operationalCost: Number(item.operationalCost || 0),
      product: {
        name: item.product.name,
      },
    })),
  }));
};

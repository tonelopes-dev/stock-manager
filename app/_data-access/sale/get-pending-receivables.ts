import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { SaleStatus } from "@prisma/client";

export interface ReceivableDto {
  id: string;
  date: Date;
  dueDate: Date | null;
  totalAmount: number;
  customerName: string;
  customerPhone: string | null;
  customerId: string | null;
  customerImageUrl: string | null;
  status: SaleStatus;
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
      status: true,
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          imageUrl: true,
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
    customerName: sale.customer?.name || "Cliente Desconhecido",
    customerPhone: sale.customer?.phone || null,
    customerId: sale.customer?.id || null,
    customerImageUrl: sale.customer?.imageUrl || null,
    status: sale.status,
  }));
};

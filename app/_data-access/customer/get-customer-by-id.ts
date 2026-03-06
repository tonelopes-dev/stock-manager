import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { CustomerDto } from "./get-customers";

export const getCustomerById = async (id: string): Promise<CustomerDto | null> => {
  const companyId = await getCurrentCompanyId();

  const customer = await db.customer.findUnique({
    where: { id, companyId },
    include: {
      _count: {
        select: {
          sales: true,
        },
      },
      categories: {
        select: { id: true, name: true, color: true },
      },
      stage: {
        select: { name: true },
      },
      sales: {
        where: { status: "ACTIVE" },
        include: {
          saleItems: {
            include: {
              product: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { date: "desc" },
      },
      checklists: {
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!customer) return null;

  const totalSpent = customer.sales?.reduce(
    (acc: number, sale: any) => acc + Number(sale.totalAmount),
    0,
  ) || 0;

  const lastSaleDate =
    customer.sales && customer.sales.length > 0 ? (customer.sales[0] as any).date : null;

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phoneNumber: customer.phone,
    categories: customer.categories,
    stageId: customer.stageId,
    stage: customer.stage,
    source: customer.source,
    birthDate: customer.birthday,
    notes: customer.notes,
    isActive: customer.isActive,
    position: customer.position,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    _count: customer._count,
    totalSpent,
    lastSaleDate,
    sales: customer.sales?.map((sale: any) => ({
      totalAmount: Number(sale.totalAmount),
      date: sale.date,
      products: sale.saleItems?.map((item: any) => ({
        name: item.product.name,
        quantity: Number(item.quantity),
      })) || [],
    })) || [],
    checklists: (customer as any).checklists || [],
  };
};

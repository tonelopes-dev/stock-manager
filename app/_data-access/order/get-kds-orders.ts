import { db } from "@/app/_lib/prisma";
import { OrderStatus } from "@prisma/client";

export interface KDSOrderDto {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  tableNumber: string | null;
  notes: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerImageUrl?: string | null;
  createdAt: Date;
  items: {
    id: string;
    productName: string;
    quantity: number;
    notes: string | null;
    environmentId: string | null;
    environmentName: string;
    status: OrderStatus;
  }[];
}

export const getKDSOrders = async (companyId: string): Promise<KDSOrderDto[]> => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const orders = await db.order.findMany({
    where: {
      companyId,
      OR: [
        {
          status: {
            in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY],
          },
        },
        {
          status: OrderStatus.DELIVERED,
          updatedAt: {
            gte: startOfToday,
          },
        },
        {
          status: OrderStatus.PAID,
          updatedAt: {
            gte: startOfToday,
          },
        },
      ],
    },
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
          imageUrl: true,
        },
      },
      orderItems: {
        include: {
          product: { 
            select: { 
              name: true, 
              environmentId: true,
              environment: { select: { name: true } }
            } 
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    tableNumber: order.tableNumber,
    notes: order.notes,
    customerName: order.customer?.name,
    customerPhone: order.customer?.phone,
    customerImageUrl: order.customer?.imageUrl,
    createdAt: order.createdAt,
    items: order.orderItems.map((item) => ({
      id: item.id,
      productName: item.product.name,
      quantity: Number(item.quantity),
      notes: item.notes,
      environmentId: item.product.environmentId,
      environmentName: item.product.environment?.name || "Cozinha",
      status: item.status,
    })),
  }));
};

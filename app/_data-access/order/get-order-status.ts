import "server-only";

import { db } from "@/app/_lib/prisma";
import { OrderStatus } from "@prisma/client";

export interface OrderStatusDto {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  totalAmount: number;
  tableNumber: string | null;
  createdAt: Date;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes: string | null;
    status: OrderStatus;
  }[];
}

export const getOrderStatus = async (
  orderId: string,
  companyId: string
): Promise<OrderStatusDto | null> => {
  const order = await db.order.findUnique({
    where: { id: orderId, companyId },
    include: {
      orderItems: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    tableNumber: order.tableNumber,
    createdAt: order.createdAt,
    items: order.orderItems.map((item) => ({
      id: item.id,
      name: item.product.name,
      quantity: Number(item.quantity),
      price: Number(item.unitPrice),
      notes: item.notes,
      status: item.status,
    })),
  };
};

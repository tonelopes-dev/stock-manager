import "server-only";

import { db } from "@/app/_lib/prisma";
import { OrderStatus } from "@prisma/client";

export interface OrderStatusDto {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  totalAmount: number;
  hasServiceTax: boolean;
  tableNumber: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  createdAt: Date;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    basePrice?: number;
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
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      orderItems: {
        include: {
          product: {
            select: { 
              name: true,
              price: true,
            },
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
    hasServiceTax: order.hasServiceTax,
    tableNumber: order.tableNumber,
    customerName: order.customer?.name,
    customerPhone: order.customer?.phone,
    createdAt: order.createdAt,
    items: order.orderItems.map((item) => ({
      id: item.id,
      name: item.product.name,
      quantity: Number(item.quantity),
      price: Number(item.unitPrice),
      basePrice: Number(item.product.price),
      notes: item.notes,
      status: item.status,
    })),
  };
};

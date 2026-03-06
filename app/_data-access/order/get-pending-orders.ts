import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { OrderStatus } from "@prisma/client";

export const getPendingOrders = async () => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return [];

  const orders = await db.order.findMany({
    where: {
      companyId,
      status: {
        in: [OrderStatus.READY, OrderStatus.PREPARING, OrderStatus.PENDING],
      },
    },
    include: {
      orderItems: {
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
      createdAt: "desc",
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    companyId: order.companyId,
    customerId: order.customerId,
    tableNumber: order.tableNumber,
    notes: order.notes,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: order.customer,
    orderItems: order.orderItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      product: item.product,
    })),
  }));
};

export type PendingOrderDto = Awaited<ReturnType<typeof getPendingOrders>>[number];

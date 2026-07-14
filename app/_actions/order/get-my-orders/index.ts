"use server";

import { db } from "@/app/_lib/prisma";
import { OrderStatusDto } from "@/app/_data-access/order/get-order-status";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";

const schema = z.object({
  companyId: z.string(),
  customerId: z.string(),
});

export const getMyOrdersAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: { companyId, customerId } }) => {
    const orders = await db.order.findMany({
      where: {
        customerId,
        companyId,
      },
      take: 100,
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        sale: {
          select: {
            id: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    const dtoOrders: OrderStatusDto[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      hasServiceTax: order.hasServiceTax,
      tableNumber: order.tableNumber,
      customerName: order.customer?.name,
      customerPhone: order.customer?.phone,
      createdAt: order.createdAt,
      saleId: order.sale?.id,
      rating: order.rating,
      feedback: order.feedback,
      items: order.orderItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        quantity: Number(item.quantity),
        price: Number(item.unitPrice),
        basePrice: Number(item.product.price),
        notes: item.notes,
        status: item.status,
      })),
    }));

    return { orders: dtoOrders };
  });

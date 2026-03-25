import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { OrderStatus, OrderSource } from "@prisma/client";

export interface ComandaDto {
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  totalAmount: number;
  orderCount: number;
  firstOrderAt: Date;
  lastOrderAt: Date;
  source: OrderSource;
  deliveryAddress?: string | null;
  deliveryFee?: number | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    createdAt: Date;
  }[];
  orders: {
    id: string;
    orderNumber: number;
    status: OrderStatus;
    createdAt: Date;
    source: OrderSource;
  }[];
}

export const getActiveComandas = async (): Promise<ComandaDto[]> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return [];

  // Fetch all orders that are not Paid or Canceled
  const activeOrders = await db.order.findMany({
    where: {
      companyId,
      status: {
        in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERED],
      },
      // MUST have a customer to be part of the "Automatic Comanda per Customer" system
      customerId: { not: null },
    },
    include: {
      customer: true,
      orderItems: {
        include: {
          product: {
            select: { name: true }
          }
        }
      }
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group by customerId
  const groups: Record<string, ComandaDto> = {};

  for (const order of activeOrders) {
    const customerId = order.customerId!;
    if (!groups[customerId]) {
      groups[customerId] = {
        customerId,
        customerName: order.customer?.name || "Cliente sem Nome",
        customerPhone: order.customer?.phone,
        totalAmount: 0,
        orderCount: 0,
        firstOrderAt: order.createdAt,
        lastOrderAt: order.createdAt,
        source: order.source,
        deliveryAddress: order.deliveryAddress,
        deliveryFee: Number(order.deliveryFee),
        items: [],
        orders: [],
      };
    }

    const group = groups[customerId];
    group.totalAmount += Number(order.totalAmount);
    group.orderCount++;
    group.lastOrderAt = order.createdAt;
    
    group.orders.push({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      source: order.source,
    });

    // Aggregate items
    for (const item of order.orderItems) {
      group.items.push({
        id: item.id,
        name: item.product.name,
        quantity: Number(item.quantity),
        price: Number(item.unitPrice),
        createdAt: item.createdAt,
      });
    }
  }

  // Convert map to sorted array (longest waiting first)
  return Object.values(groups).sort((a, b) => a.firstOrderAt.getTime() - b.firstOrderAt.getTime());
};

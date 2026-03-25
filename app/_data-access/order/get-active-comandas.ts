import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { OrderStatus, OrderSource } from "@prisma/client";

export interface ComandaDto {
  id: string;
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
    // For iFood, every order is a separate comanda. For others, group by customer.
    const groupingId = order.source === OrderSource.IFOOD ? order.id : order.customerId!;
    
    if (!groups[groupingId]) {
      groups[groupingId] = {
        id: groupingId,
        customerId: order.customerId!,
        customerName: order.customer?.name || "Cliente sem Nome",
        customerPhone: order.customer?.phone,
        totalAmount: 0,
        orderCount: 0,
        firstOrderAt: order.createdAt,
        lastOrderAt: order.createdAt,
        source: order.source,
        deliveryAddress: order.deliveryAddress ? JSON.stringify(order.deliveryAddress) : null,
        deliveryFee: Number(order.deliveryFee),
        items: [],
        orders: [],
      };
    }

    const group = groups[groupingId];
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

    // Aggregate items by productId within the comanda
    for (const item of order.orderItems) {
      const existingItem = group.items.find(i => i.id === item.productId);
      if (existingItem) {
        existingItem.quantity += Number(item.quantity);
      } else {
        group.items.push({
          id: item.productId, // Use productId for easier UI handling
          name: item.product.name,
          quantity: Number(item.quantity),
          price: Number(item.unitPrice),
          createdAt: item.createdAt,
        });
      }
    }
  }

  // Convert map to sorted array (longest waiting first)
  return Object.values(groups).sort((a, b) => a.firstOrderAt.getTime() - b.firstOrderAt.getTime());
};

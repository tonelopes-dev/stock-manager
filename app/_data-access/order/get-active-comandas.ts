import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { OrderStatus } from "@prisma/client";

export interface ComandaDto {
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  totalAmount: number;
  orderCount: number;
  hasServiceTax: boolean;
  firstOrderAt: Date;
  lastOrderAt: Date;
  discountAmount: number;
  extraAmount: number;
  adjustmentReason?: string | null;
  isEmployeeSale: boolean;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    cost: number;
    operationalCost: number;
    createdAt: Date;
  }[];
  orders: {
    id: string;
    orderNumber: number;
    status: OrderStatus;
    createdAt: Date;
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
            select: { 
              name: true,
              cost: true,
              operationalCost: true,
            }
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
        hasServiceTax: (order as any).hasServiceTax,
        firstOrderAt: order.createdAt,
        lastOrderAt: order.createdAt,
        discountAmount: 0,
        extraAmount: 0,
        adjustmentReason: (order as any).adjustmentReason,
        isEmployeeSale: (order as any).isEmployeeSale,
        items: [],
        orders: [],
      };
    }

    const group = groups[customerId];
    group.totalAmount += Number(order.totalAmount);
    group.discountAmount += Number((order as any).discountAmount || 0);
    group.extraAmount += Number((order as any).extraAmount || 0);
    group.orderCount++;
    group.lastOrderAt = order.createdAt;
    
    group.orders.push({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
    });

    // Aggregate items
    for (const item of order.orderItems) {
      group.items.push({
        id: item.id,
        name: item.product.name,
        quantity: Number(item.quantity),
        price: Number(item.unitPrice),
        cost: Number(item.product.cost),
        operationalCost: Number(item.product.operationalCost),
        createdAt: item.createdAt,
      });
    }
  }

  // Convert map to sorted array (longest waiting first)
  return Object.values(groups).sort((a, b) => a.firstOrderAt.getTime() - b.firstOrderAt.getTime());
};

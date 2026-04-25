import { OrderStatus } from "@prisma/client";
import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";

export interface StationSummary {
  name: string;
  ready: number;
  total: number;
  isDone: boolean;
}

export const getDerivedStatus = (
  order: KDSOrderDto,
  activeEnvId: string
): OrderStatus => {
  const itemsForThisView =
    activeEnvId === "all"
      ? order.items
      : order.items.filter((item) => item.environmentId === activeEnvId);

  if (itemsForThisView.length === 0) return order.status;

  if (activeEnvId === "all") {
    if (order.status === OrderStatus.PAID) return OrderStatus.PAID;
    if (order.status === OrderStatus.DELIVERED) return OrderStatus.DELIVERED;
    if (order.status === OrderStatus.CANCELED) return OrderStatus.CANCELED;

    const allItemsDone = order.items.every(
      (i) =>
        i.status === OrderStatus.READY ||
        i.status === OrderStatus.DELIVERED ||
        i.status === OrderStatus.PAID
    );

    if (allItemsDone) {
      return OrderStatus.READY;
    } else {
      const hasStarted = order.items.some(
        (i) => i.status !== OrderStatus.PENDING
      );
      return hasStarted ? OrderStatus.PREPARING : OrderStatus.PENDING;
    }
  } else {
    if (order.status === OrderStatus.PAID) return OrderStatus.PAID;

    const allStationItemsDelivered = itemsForThisView.every(
      (i) =>
        i.status === OrderStatus.DELIVERED || i.status === OrderStatus.PAID
    );

    if (allStationItemsDelivered) {
      return OrderStatus.DELIVERED;
    }

    const allStationItemsReady = itemsForThisView.every(
      (i) =>
        i.status === OrderStatus.READY ||
        i.status === OrderStatus.DELIVERED ||
        i.status === OrderStatus.PAID
    );

    if (allStationItemsReady) {
      return OrderStatus.READY;
    } else {
      const hasStartedInStation = itemsForThisView.some(
        (i) => i.status !== OrderStatus.PENDING
      );
      return hasStartedInStation ? OrderStatus.PREPARING : OrderStatus.PENDING;
    }
  }
};

export const getStationSummary = (order: KDSOrderDto): StationSummary[] => {
  const envs = Array.from(new Set(order.items.map((i) => i.environmentId)));
  
  return envs.map((envId) => {
    const envItems = order.items.filter((i) => i.environmentId === envId);
    const envName = envItems[0]?.environmentName || "Cozinha";
    const readyCount = envItems.filter(
      (i) =>
        i.status === OrderStatus.READY ||
        i.status === OrderStatus.DELIVERED ||
        i.status === OrderStatus.PAID
    ).length;

    return {
      name: envName,
      ready: readyCount,
      total: envItems.length,
      isDone: readyCount === envItems.length,
    };
  });
};

export const getPreviousStatus = (status: OrderStatus): OrderStatus | null => {
  switch (status) {
    case OrderStatus.PREPARING:
      return OrderStatus.PENDING;
    case OrderStatus.READY:
      return OrderStatus.PREPARING;
    case OrderStatus.DELIVERED:
      return OrderStatus.READY;
    case OrderStatus.PAID:
      return OrderStatus.READY;
    default:
      return null;
  }
};

/**
 * Verifica se um pedido ultrapassou o SLA (30 min por padrão)
 */
export const isUrgent = (createdAt: Date, now: Date = new Date(), slaMinutes: number = 30): boolean => {
  const diffInMs = now.getTime() - createdAt.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  return diffInMinutes >= slaMinutes;
};

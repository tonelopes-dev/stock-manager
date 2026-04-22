import { OrderStatus } from "@prisma/client";
import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";

export interface StationSummary {
  name: string;
  count: string;
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
    const allItemsDone = order.items.every(
      (i) =>
        i.status === OrderStatus.READY ||
        i.status === OrderStatus.DELIVERED ||
        i.status === OrderStatus.PAID
    );

    if (allItemsDone) {
      if (
        order.status === OrderStatus.DELIVERED ||
        order.status === OrderStatus.PAID
      ) {
        return order.status;
      }
      return OrderStatus.READY;
    } else {
      const hasStarted = order.items.some(
        (i) => i.status !== OrderStatus.PENDING
      );
      return hasStarted ? OrderStatus.PREPARING : OrderStatus.PENDING;
    }
  } else {
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
    const envName = envItems[0]?.product?.category?.name || "Cozinha"; // Fallback name
    const readyCount = envItems.filter(
      (i) =>
        i.status !== OrderStatus.PENDING && i.status !== OrderStatus.PREPARING
    ).length;

    return {
      name: envName,
      count: `${readyCount}/${envItems.length}`,
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

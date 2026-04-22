import { OrderStatus } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/app/_actions/order/update-status";
import { updateItemStatusAction } from "@/app/_actions/order/update-item-status";
import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";

interface UseKdsActionsProps {
  orders: KDSOrderDto[];
  setOrders: React.Dispatch<React.SetStateAction<KDSOrderDto[]>>;
  pendingUpdates: React.MutableRefObject<Set<string>>;
  companyId: string;
  activeEnvId: string;
}

export const useKdsActions = ({
  orders,
  setOrders,
  pendingUpdates,
  companyId,
  activeEnvId,
}: UseKdsActionsProps) => {
  const [isUpdatingIds, setIsUpdatingIds] = useState<Set<string>>(new Set());

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    if (isUpdatingIds.has(orderId)) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    pendingUpdates.current.add(orderId);
    setIsUpdatingIds((prev) => new Set(prev).add(orderId));

    const itemsToUpdate =
      activeEnvId === "all"
        ? order.items
        : order.items.filter((i) => i.environmentId === activeEnvId);

    // Optimistic Update
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: activeEnvId === "all" ? status : o.status,
          items: o.items.map((i) => {
            const shouldUpdate = activeEnvId === "all" || i.environmentId === activeEnvId;
            return shouldUpdate ? { ...i, status } : i;
          }),
        };
      })
    );

    try {
      if (activeEnvId === "all") {
        await updateOrderStatusAction({ orderId, status, companyId });
      }

      await Promise.all(
        itemsToUpdate.map((item) =>
          updateItemStatusAction({ itemId: item.id, status, companyId })
        )
      );

      toast.success(`Fluxo atualizado!`);
    } catch (error) {
      toast.error("Erro ao sincronizar atualização");
    } finally {
      setIsUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      setTimeout(() => {
        pendingUpdates.current.delete(orderId);
      }, 10000);
    }
  };

  const handleItemStatusUpdate = async (itemId: string, status: OrderStatus) => {
    const order = orders.find((o) => o.items.some((i) => i.id === itemId));
    if (!order || isUpdatingIds.has(order.id)) return;

    const orderId = order.id;
    pendingUpdates.current.add(orderId);
    setIsUpdatingIds((prev) => new Set(prev).add(orderId));

    setOrders((prev) =>
      prev.map((o) => ({
        ...o,
        items: o.items.map((i) => (i.id === itemId ? { ...i, status } : i)),
      }))
    );

    try {
      const result = await updateItemStatusAction({ itemId, status, companyId });
      if (!result?.data?.success) throw new Error();
      toast.success(`Item atualizado!`);
    } catch (error) {
      toast.error("Erro ao atualizar item");
    } finally {
      setIsUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      setTimeout(() => {
        pendingUpdates.current.delete(orderId);
      }, 10000);
    }
  };

  return { handleStatusUpdate, handleItemStatusUpdate, isUpdatingIds };
};

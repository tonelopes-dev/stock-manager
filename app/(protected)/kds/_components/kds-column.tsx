"use client";

import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";
import { OrderStatus } from "@prisma/client";
import { Badge } from "@/app/_components/ui/badge";
import { Utensils } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "@/app/_lib/utils";
import { KDSCard } from "./kds-card";

interface KDSColumnProps {
  title: string;
  orders: any[];
  accentColor: string;
  activeEnvId: string;
  onAction: (orderId: string) => void;
  onItemAction: (itemId: string, status: OrderStatus) => void;
  onUndo: (orderId: string, currentStatus: OrderStatus) => void;
  onDetail: (order: KDSOrderDto) => void;
  isUpdating: (orderId: string) => boolean;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
}

export const KDSColumn = ({
  title,
  orders,
  accentColor,
  activeEnvId,
  onAction,
  onItemAction,
  onUndo,
  onDetail,
  isUpdating,
  actionLabel,
  actionIcon,
}: KDSColumnProps) => {
  const [parent] = useAutoAnimate();

  return (
    <div className="flex w-[400px] min-w-[400px] flex-col rounded-[2.5rem] border border-border/60 bg-muted/40 p-5 shadow-inner">
      <div className="mb-6 flex items-center justify-between px-4 py-2">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase italic tracking-tighter text-muted-foreground">
          <span className={cn("h-2.5 w-2.5 rounded-full", accentColor)} />
          {title}
        </h3>
        <Badge
          variant="secondary"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background p-0 font-black"
        >
          {orders.length}
        </Badge>
      </div>

      <div
        ref={parent}
        className="scrollbar-hide flex-1 space-y-6 overflow-y-auto pr-1"
      >
        {orders.map((order) => (
          <KDSCard
            key={order.id}
            order={order}
            accentColor={accentColor}
            activeEnvId={activeEnvId}
            onAction={onAction}
            onItemAction={onItemAction}
            onUndo={onUndo}
            onDetail={onDetail}
            actionLabel={actionLabel}
            actionIcon={actionIcon}
            isUpdating={isUpdating(order.id)}
          />
        ))}
        {orders.length === 0 && (
          <div className="flex animate-pulse flex-col items-center justify-center py-24 text-center opacity-40 grayscale">
            <Utensils className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Vazio
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

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
    <div className="flex w-[260px] min-w-[260px] flex-col rounded-[1.8rem] border border-border/60 bg-muted/40 p-3 shadow-inner md:w-[300px] md:min-w-[300px] md:rounded-[2rem] md:p-4 xl:w-[380px] xl:min-w-[380px] xl:rounded-[2.5rem] xl:p-5">
      <div className="mb-3 flex items-center justify-between px-2 py-1 md:mb-4 md:px-3 xl:mb-6 xl:px-4 xl:py-2">
        <h3 className="flex items-center gap-1.5 text-xs font-black uppercase italic tracking-tighter text-muted-foreground md:gap-2 md:text-sm">
          <span className={cn("h-2 w-2 rounded-full md:h-2.5 md:w-2.5", accentColor)} />
          {title}
        </h3>
        <Badge
          variant="secondary"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background p-0 font-black md:h-8 md:w-8"
        >
          {orders.length}
        </Badge>
      </div>

      <div
        ref={parent}
        className="scrollbar-hide flex-1 space-y-3 overflow-y-auto pr-0.5 md:space-y-4 xl:space-y-6 xl:pr-1"
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

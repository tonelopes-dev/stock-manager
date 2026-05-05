"use client";

import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";
import { OrderStatus } from "@prisma/client";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import {
  Clock,
  CheckCircle2,
  Play,
  Check,
  User,
  Phone,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { differenceInMinutes } from "date-fns";
import { useState, useEffect } from "react";
import { cn } from "@/app/_lib/utils";
import Image from "next/image";

interface KDSCardProps {
  order: KDSOrderDto & { 
    displayStatus?: OrderStatus;
    stationSummary?: any[];
  };
  activeEnvId: string;
  onAction: (orderId: string) => void;
  onItemAction: (itemId: string, status: OrderStatus) => void;
  onUndo: (orderId: string, currentStatus: OrderStatus) => void;
  onDetail: (order: KDSOrderDto) => void;
  isUpdating: boolean;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  accentColor?: string;
}

export const KDSCard = ({
  order,
  activeEnvId,
  onAction,
  onItemAction,
  onUndo,
  onDetail,
  isUpdating,
  actionLabel,
  actionIcon,
  accentColor,
}: KDSCardProps) => {
  const isExpeditionView = activeEnvId === "all";
  const [minutesSince, setMinutesSince] = useState(
    differenceInMinutes(new Date(), new Date(order.createdAt)),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesSince(
        differenceInMinutes(new Date(), new Date(order.createdAt)),
      );
    }, 60000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const getTimeColor = () => {
    if (
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.PAID
    )
      return "bg-slate-100 text-slate-500 border-slate-200";
    if (minutesSince < 10)
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (minutesSince < 20)
      return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-destructive/10 text-destructive border-destructive/20 animate-pulse";
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "bg-orange-500";
      case OrderStatus.PREPARING:
        return "bg-primary";
      case OrderStatus.READY:
        return "bg-emerald-500";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <Card
      data-testid={`kds-card-${order.id}`}
      className={cn(
        "group relative overflow-hidden rounded-[1.5rem] border-none p-4 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl md:rounded-[1.8rem] md:p-5 xl:rounded-[2rem] xl:p-6",
        isExpeditionView ? "bg-white ring-1 ring-slate-100" : "bg-background",
        isUpdating && "pointer-events-none opacity-60 grayscale-[0.5]",
      )}
    >
      {isUpdating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
      <div className="flex flex-col gap-3 md:gap-4 xl:gap-5">
        <div className="flex items-start justify-between">
          <div
            className="flex cursor-pointer flex-col"
            onClick={() => onDetail(order)}
          >
            <span className="text-[9px] font-black uppercase leading-none tracking-widest text-muted-foreground md:text-[10px]">
              {isExpeditionView ? "EXPEDIÇÃO" : "PEDIDO"}
            </span>
            <span className="text-2xl font-black italic text-foreground md:text-3xl">
              #{order.orderNumber}
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-primary md:text-[11px]">
              Detalhes do Pedido
            </span>
          </div>
          <div className="flex flex-col items-end gap-1.5 md:gap-2">
            {order.displayStatus !== OrderStatus.PAID && (
              <div
                className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold md:gap-1.5 md:px-3 md:py-1 ${getTimeColor()}`}
              >
                <Clock className="h-3 w-3" />
                {minutesSince} min
              </div>
            )}
            {order.tableNumber && (
              <Badge className="h-6 rounded-lg border-none bg-foreground px-2.5 text-[9px] font-black text-background md:h-7 md:rounded-xl md:px-3 md:text-[10px]">
                MESA {order.tableNumber}
              </Badge>
            )}
          </div>
        </div>

        {isExpeditionView &&
          order.displayStatus !== OrderStatus.PAID &&
          order.stationSummary &&
          order.stationSummary.length > 0 && (
            <div className="space-y-1.5 md:space-y-2">
              <span className="ml-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Status por Praça
              </span>
              <div className="flex flex-wrap gap-1.5 rounded-xl bg-muted/50 p-2 md:gap-2 md:rounded-2xl md:p-3">
                {order.stationSummary.map((station: any, idx: number) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className={cn(
                      "flex h-6 items-center gap-1 border-none px-2 text-[9px] font-black uppercase tracking-wider transition-all md:h-7 md:gap-1.5 md:px-3",
                      station.isDone
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                        : "bg-orange-100 text-orange-700 shadow-sm",
                    )}
                  >
                    {station.isDone ? (
                      <Check className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    ) : (
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
                    )}
                    {station.name}: {station.ready}/{station.total}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        <div className="space-y-1.5 md:space-y-2">
          {order.items.map((item: any) => (
            <div
              key={item.id}
              className={cn(
                "group/item relative flex items-center justify-between gap-2 rounded-xl border transition-all md:gap-3 md:rounded-2xl",
                isExpeditionView
                  ? "border-slate-100 bg-slate-50/50 p-2"
                  : "border-border bg-muted/40 p-2.5 md:p-3",
                item.status === OrderStatus.READY && !isExpeditionView
                  ? "border-emerald-100 bg-emerald-50/30"
                  : "",
              )}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-lg font-black text-white shadow-sm",
                    "h-8 w-8 text-xs md:h-8 md:w-8 md:rounded-xl md:text-[11px] xl:h-7 xl:w-7 xl:text-[10px]",
                    getStatusColor(item.status),
                  )}
                >
                  {item.quantity}
                </span>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "font-black leading-tight text-foreground",
                      isExpeditionView ? "text-[11px]" : "text-xs md:text-sm xl:text-xs",
                    )}
                  >
                    {item.productName}
                  </span>
                  {item.notes && (
                    <span className="text-[9px] font-bold uppercase italic leading-tight text-destructive md:text-[10px]">
                      {item.notes}
                    </span>
                  )}
                </div>
              </div>

              {!isExpeditionView &&
                item.status !== OrderStatus.DELIVERED &&
                item.status !== OrderStatus.PAID && (
                  <div className="flex shrink-0 items-center">
                    {item.status === OrderStatus.PENDING && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 gap-1.5 rounded-full border-primary/20 px-3 text-[10px] font-black text-primary hover:bg-primary hover:text-white md:h-10 md:px-4 md:text-xs xl:h-8 xl:px-3 xl:text-[10px]"
                        onClick={() => onItemAction(item.id, OrderStatus.PREPARING)}
                        disabled={isUpdating}
                      >
                        <Play size={12} fill="currentColor" /> PREPARAR
                      </Button>
                    )}
                    {item.status === OrderStatus.PREPARING && (
                      <Button
                        size="sm"
                        className="h-9 gap-1.5 rounded-full bg-primary px-3 text-[10px] font-black text-white hover:bg-primary/90 md:h-10 md:px-4 md:text-xs xl:h-8 xl:px-3 xl:text-[10px]"
                        onClick={() => onItemAction(item.id, OrderStatus.READY)}
                        disabled={isUpdating}
                      >
                        <Check size={13} strokeWidth={4} /> PRONTO
                      </Button>
                    )}
                    {item.status === OrderStatus.READY && (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-100 md:h-10 md:w-10 xl:h-8 xl:w-8">
                        <Check size={16} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                )}

              {isExpeditionView && (
                <div className="flex shrink-0 items-center gap-2">
                   {(item.status === OrderStatus.READY || 
                     item.status === OrderStatus.DELIVERED || 
                     item.status === OrderStatus.PAID) ? (
                     <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 md:h-7 md:w-7">
                        <Check size={12} strokeWidth={4} />
                     </div>
                   ) : (
                     <Badge variant="outline" className="h-6 border-orange-200 bg-orange-50 px-2 text-[8px] font-black text-orange-600 md:h-7 md:px-2.5 md:text-[9px]">
                        {item.status === OrderStatus.PREPARING ? "EM PREPARO" : "PENDENTE"}
                     </Badge>
                   )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Customer Info Badge */}
        {(order.customerName || order.customerPhone) && (
          <div className="flex items-center gap-2.5 rounded-xl border border-primary/10 bg-primary/5 p-3 text-[11px] text-primary md:gap-3 md:rounded-2xl md:p-4">
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-primary/20 md:h-6 md:w-6">
              {order.customerImageUrl ? (
                <Image
                  src={order.customerImageUrl}
                  alt={order.customerName || "Cliente"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User size={14} />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider md:text-xs">
                Cliente: {order.customerName || "Não informado"}
              </span>
              {order.customerPhone && (
                <>
                  <span className="hidden opacity-30 md:inline">|</span>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 opacity-70" />
                    <span className="text-[11px] font-bold md:text-xs">{order.customerPhone}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {order.notes && !order.notes.startsWith("Cliente:") && (
          <div className="flex items-start gap-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-[11px] text-orange-600 md:gap-3 md:rounded-2xl md:p-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="font-bold italic">{order.notes}</p>
          </div>
        )}

        <Button
          onClick={() => onAction(order.id)}
          disabled={isUpdating}
          data-testid={`kds-action-button-${order.id}`}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2.5 rounded-[1.5rem] text-sm font-black transition-all md:h-14 md:gap-3 md:rounded-[1.8rem] md:text-sm xl:text-xs",
            accentColor === "bg-emerald-500" ||
              order.displayStatus === OrderStatus.READY
              ? "border-b-4 border-emerald-700 bg-emerald-500 text-background shadow-2xl shadow-emerald-200 hover:bg-emerald-600 active:translate-y-1 active:border-b-0"
              : "border-b-4 border-foreground bg-foreground text-background shadow-2xl shadow-slate-300 hover:bg-foreground active:translate-y-1 active:border-b-0",
            (isExpeditionView && order.displayStatus !== OrderStatus.READY) ||
              order.displayStatus === OrderStatus.DELIVERED ||
              order.displayStatus === OrderStatus.PAID
              ? "hidden"
              : "",
          )}
        >
          {isExpeditionView ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            actionIcon
          )}
          {isExpeditionView
            ? "ENTREGAR PEDIDO"
            : `MARCAR TUDO: ${actionLabel?.toUpperCase()}`}
        </Button>

        {onUndo && order.status !== OrderStatus.PENDING && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-full rounded-xl text-[11px] font-bold text-muted-foreground hover:bg-muted md:h-11 md:text-xs xl:h-8 xl:text-[10px]"
            onClick={() => onUndo(order.id, order.status)}
            disabled={isUpdating}
            data-testid={`kds-undo-button-${order.id}`}
          >
            <RotateCcw className="mr-2 h-3 w-3" /> VOLTAR STATUS
          </Button>
        )}
      </div>
    </Card>
  );
};

"use client";

import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";
import { useState, useEffect, useMemo } from "react";
import { OrderStatus } from "@prisma/client";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { 
  Clock, 
  CheckCircle2, 
  Play, 
  AlertCircle, 
  Utensils, 
  RotateCcw,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/app/_actions/order/update-status";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/app/_components/ui/sheet";

interface KDSClientProps {
  initialOrders: KDSOrderDto[];
  companyId: string;
  environments: EnvironmentOption[];
}

export const KDSClient = ({ initialOrders, companyId, environments }: KDSClientProps) => {
  const router = useRouter();
  const [orders, setOrders] = useState<KDSOrderDto[]>(initialOrders);
  const [activeEnvId, setActiveEnvId] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<KDSOrderDto | null>(null);

  // SSE Integration
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryCount = 0;

    const connect = () => {
      if (eventSource) eventSource.close();
      eventSource = new EventSource("/api/kds/stream");
      eventSource.onmessage = (event) => {
        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          if (data.type === "NEW_ORDER" || data.type === "STATUS_UPDATED" || data.type === "ORDER_UPDATED") {
            router.refresh();
          }
        } catch (e) {}
      };
      eventSource.onerror = () => {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 15000);
        setTimeout(() => {
          retryCount++;
          connect();
        }, delay);
      };
    };
    connect();
    return () => eventSource?.close();
  }, [router]);

  // Update orders when initialOrders change (server-side refresh)
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    const result = await updateOrderStatusAction({ orderId, status, companyId });
    if (result?.data?.success) {
      toast.success(`Status atualizado!`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } else {
      toast.error("Erro ao atualizar status");
    }
  };

  const getPreviousStatus = (status: OrderStatus): OrderStatus | null => {
    switch (status) {
      case OrderStatus.PREPARING: return OrderStatus.PENDING;
      case OrderStatus.READY: return OrderStatus.PREPARING;
      case OrderStatus.DELIVERED: return OrderStatus.READY;
      case OrderStatus.PAID: return OrderStatus.READY;
      default: return null;
    }
  };

  const filteredOrders = useMemo(() => {
    if (activeEnvId === "all") return orders;
    return orders
      .map((order) => ({
        ...order,
        items: order.items.filter((item) => item.environmentId === activeEnvId),
      }))
      .filter((order) => order.items.length > 0);
  }, [orders, activeEnvId]);

  const columns: {
    title: string;
    status: OrderStatus | OrderStatus[];
    color: string;
    action: OrderStatus | null;
    label: string;
    icon: React.ReactNode | null;
  }[] = [
    { title: "Pendentes", status: OrderStatus.PENDING, color: "bg-orange-500", action: OrderStatus.PREPARING, label: "Iniciar", icon: <Play className="h-4 w-4" /> },
    { title: "Preparando", status: OrderStatus.PREPARING, color: "bg-primary", action: OrderStatus.READY, label: "Pronto", icon: <CheckCircle2 className="h-4 w-4" /> },
    { title: "Prontos", status: OrderStatus.READY, color: "bg-emerald-500", action: OrderStatus.DELIVERED, label: "Entregar", icon: <CheckCircle2 className="h-4 w-4 text-background" /> },
    { title: "Finalizados", status: [OrderStatus.DELIVERED, OrderStatus.PAID], color: "bg-slate-400", action: null, label: "OK", icon: null },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-background px-8 py-3">
        <Tabs value={activeEnvId} onValueChange={setActiveEnvId} className="w-auto">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all" className="px-6 text-xs font-bold uppercase tracking-wider">Todos</TabsTrigger>
            {environments.map((env) => (
              <TabsTrigger key={env.id} value={env.id} className="px-6 text-xs font-bold uppercase tracking-wider">
                {env.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-orange-500" /> Pendentes</span>
          <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Ativos</span>
        </div>
      </div>

      <div className="scrollbar-hide flex flex-1 gap-6 overflow-x-auto p-8">
        {columns.map((col) => (
          <KDSColumn
            key={col.title}
            title={col.title}
            orders={filteredOrders.filter((o) => 
               Array.isArray(col.status) ? col.status.includes(o.status) : o.status === col.status
            )}
            accentColor={col.color}
            onAction={col.action ? (id: string) => handleStatusUpdate(id, col.action as OrderStatus) : undefined}
            onUndo={(id: string, currentStatus: OrderStatus) => {
              const prev = getPreviousStatus(currentStatus);
              if (prev) handleStatusUpdate(id, prev);
            }}
            actionLabel={col.label}
            actionIcon={col.icon}
            onDetail={setSelectedOrder}
          />
        ))}
      </div>

      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-3xl font-black italic">Pedido #{selectedOrder?.orderNumber}</SheetTitle>
            <SheetDescription>Detalhes completos da comanda</SheetDescription>
          </SheetHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-muted p-4">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Mesa</span>
                  <p className="text-xl font-bold">{selectedOrder.tableNumber || "N/A"}</p>
                </div>
                <div className="rounded-2xl border bg-muted p-4">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Entrada</span>
                  <p className="font-bold">{formatDistanceToNow(new Date(selectedOrder.createdAt), { locale: ptBR, addSuffix: true })}</p>
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-muted-foreground">Itens do Pedido</span>
                <div className="divide-y rounded-2xl border bg-card">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-4">
                      <div className="flex justify-between">
                        <span className="font-bold">{item.quantity}x {item.productName}</span>
                      </div>
                      {item.notes && (
                        <p className="mt-1 text-sm font-bold text-destructive">OBS: {item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase text-muted-foreground">Observações Gerais</span>
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 font-bold text-orange-700 italic">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const KDSColumn = ({ title, orders, accentColor, onAction, onUndo, actionLabel, actionIcon, onDetail }: any) => {
  return (
    <div className="flex w-[380px] min-w-[380px] flex-col rounded-[2.5rem] border border-border/60 bg-muted/40 p-5 shadow-inner">
      <div className="mb-6 flex items-center justify-between px-4 py-2">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase italic tracking-tighter text-muted-foreground">
          <span className={`h-2.5 w-2.5 rounded-full ${accentColor} animate-pulse`} />
          {title}
        </h3>
        <Badge variant="secondary" className="h-8 w-8 rounded-full border border-border bg-background p-0 flex items-center justify-center font-black">
          {orders.length}
        </Badge>
      </div>

      <div className="scrollbar-hide flex-1 space-y-6 overflow-y-auto pr-1">
        {orders.map((order: KDSOrderDto) => (
          <KDSCard 
            key={order.id} 
            order={order} 
            accentColor={accentColor} 
            onAction={onAction} 
            onUndo={onUndo}
            onDetail={onDetail}
            actionLabel={actionLabel}
            actionIcon={actionIcon}
          />
        ))}
        {orders.length === 0 && (
          <div className="flex animate-pulse flex-col items-center justify-center py-24 text-center opacity-40 grayscale">
            <Utensils className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vazio</p>
          </div>
        )}
      </div>
    </div>
  );
};

const KDSCard = ({ order, accentColor, onAction, onUndo, actionLabel, actionIcon, onDetail }: any) => {
  const [minutesSince, setMinutesSince] = useState(differenceInMinutes(new Date(), new Date(order.createdAt)));

  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesSince(differenceInMinutes(new Date(), new Date(order.createdAt)));
    }, 60000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const getTimeColor = () => {
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.PAID) return "bg-slate-100 text-slate-500 border-slate-200";
    if (minutesSince < 10) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (minutesSince < 20) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-destructive/10 text-destructive border-destructive/20 animate-pulse";
  };

  return (
    <Card className="group relative rounded-[2.5rem] border-none bg-background p-6 shadow-xl shadow-slate-200/40 transition-all duration-500 hover:scale-[1.02] active:scale-95">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div className="cursor-pointer flex flex-col" onClick={() => onDetail(order)}>
            <span className="text-[10px] font-black uppercase leading-none tracking-widest text-muted-foreground">Pedido</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black italic text-foreground">#{order.orderNumber}</span>
              <Info className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${getTimeColor()}`}>
              <Clock className="h-3 w-3" />
              {minutesSince} min
            </div>
            {order.tableNumber && (
              <Badge className="h-7 rounded-xl border-none bg-foreground px-3 text-[10px] font-black text-background">
                MESA {order.tableNumber}
              </Badge>
            )}
            {onUndo && order.status !== OrderStatus.PENDING && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={() => onUndo(order.id, order.status)}
              >
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-[2rem] border border-border bg-muted/80 p-5">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex flex-col gap-1">
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-primary bg-background text-xs font-black text-primary shadow-sm">
                  {item.quantity}
                </span>
                <span className="text-sm font-black leading-tight text-foreground line-clamp-2">
                  {item.productName}
                </span>
              </div>
              {item.notes && (
                <div className="ml-10 rounded-lg bg-destructive/10 px-2 py-1">
                  <p className="text-[10px] font-bold uppercase italic text-destructive text-center">
                    {item.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="flex items-start gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-[11px] text-orange-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="font-bold italic">{order.notes}</p>
          </div>
        )}

        {onAction && (
          <Button
            onClick={() => onAction(order.id)}
            className={`flex h-16 w-full items-center justify-center gap-3 rounded-[1.8rem] text-sm font-black transition-all ${
              accentColor === "bg-emerald-500"
                ? "border-b-4 border-emerald-700 bg-emerald-500 text-background shadow-2xl shadow-emerald-200 hover:bg-emerald-600 active:translate-y-1 active:border-b-0"
                : "border-b-4 border-foreground bg-foreground text-background shadow-2xl shadow-slate-300 hover:bg-foreground active:translate-y-1 active:border-b-0"
            }`}
          >
            {actionIcon}
            {actionLabel.toUpperCase()}
          </Button>
        )}
      </div>
    </Card>
  );
};

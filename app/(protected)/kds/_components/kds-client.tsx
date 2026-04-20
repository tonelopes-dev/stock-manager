"use client";

import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";
import { useState, useEffect } from "react";
import { OrderStatus } from "@prisma/client";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Clock, CheckCircle2, Play, AlertCircle, Utensils } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/app/_actions/order/update-status";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface KDSClientProps {
  initialOrders: KDSOrderDto[];
  companyId: string;
}

export const KDSClient = ({ initialOrders, companyId }: KDSClientProps) => {
  const router = useRouter();
  const [orders, setOrders] = useState<KDSOrderDto[]>(initialOrders);

  // SSE Integration with Exponential Backoff
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;

    const connect = () => {
      if (eventSource) eventSource.close();

      eventSource = new EventSource("/api/kds/stream");

      eventSource.onopen = () => {
        retryCount = 0; // Reset retry count on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          if (data.type === "NEW_ORDER" || data.type === "STATUS_UPDATED") {
            router.refresh();
          }
        } catch (e) {
          // Ignore parse errors (e.g., keep-alive strings)
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE Error:", err);
        eventSource?.close();
        
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        
        retryTimeout = setTimeout(() => {
          retryCount++;
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [router]);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    const result = await updateOrderStatusAction({
      orderId,
      status,
      companyId,
    });
    if (result?.data?.success) {
      toast.success(`Pedido atualizado!`);
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    } else {
      toast.error("Erro ao atualizar pedido");
    }
  };

  const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING);
  const preparingOrders = orders.filter(
    (o) => o.status === OrderStatus.PREPARING,
  );
  const readyOrders = orders.filter((o) => o.status === OrderStatus.READY);

  return (
    <div className="scrollbar-hide flex h-full gap-6 overflow-x-auto p-8">
      <KDSColumn
        title="Pendentes"
        orders={pendingOrders}
        accentColor="bg-orange-500"
        onAction={(id) => handleStatusUpdate(id, OrderStatus.PREPARING)}
        actionLabel="Iniciar"
        actionIcon={<Play className="h-4 w-4" />}
      />
      <KDSColumn
        title="Preparando"
        orders={preparingOrders}
        accentColor="bg-primary"
        onAction={(id) => handleStatusUpdate(id, OrderStatus.READY)}
        actionLabel="Pronto"
        actionIcon={<CheckCircle2 className="h-4 w-4" />}
      />
      <KDSColumn
        title="Prontos"
        orders={readyOrders}
        accentColor="bg-emerald-500"
        onAction={(id) => handleStatusUpdate(id, OrderStatus.DELIVERED)}
        actionLabel="Entregar"
        actionIcon={<CheckCircle2 className="h-4 w-4 text-background" />}
      />
    </div>
  );
};

interface KDSColumnProps {
  title: string;
  orders: KDSOrderDto[];
  accentColor: string;
  onAction: (id: string) => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
}

const KDSColumn = ({
  title,
  orders,
  accentColor,
  onAction,
  actionLabel,
  actionIcon,
}: KDSColumnProps) => {
  return (
    <div className="flex w-[380px] min-w-[380px] flex-col rounded-[2.5rem] border border-border/60 bg-muted/40 p-5 shadow-inner">
      <div className="mb-6 flex items-center justify-between px-4 py-2">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase italic tracking-tighter text-muted-foreground">
          <span
            className={`h-2.5 w-2.5 rounded-full ${accentColor} animate-pulse`}
          />
          {title}
        </h3>
        <Badge
          variant="secondary"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background p-0 font-black text-foreground shadow-sm"
        >
          {orders.length}
        </Badge>
      </div>

      <div className="scrollbar-hide flex-1 space-y-6 overflow-y-auto pr-1">
        {orders.map((order) => (
          <Card
            key={order.id}
            className="group rounded-[2.5rem] border-none bg-background p-6 shadow-xl shadow-slate-200/40 transition-all duration-500 hover:scale-[1.03] active:scale-95"
          >
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase leading-none tracking-widest text-muted-foreground">
                    Pedido
                  </span>
                  <span className="text-3xl font-black italic text-foreground">
                    #{order.orderNumber}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="mb-2 flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-bold text-muted-foreground">
                    <Clock className="h-3 w-3 text-primary" />
                    {formatDistanceToNow(new Date(order.createdAt), {
                      locale: ptBR,
                    })}
                  </div>
                  {order.tableNumber && (
                    <Badge className="h-7 rounded-xl border-none bg-foreground px-3 text-[10px] font-black text-background">
                      MESA {order.tableNumber}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3 rounded-[2rem] border border-border bg-muted/80 p-5">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="flex gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-primary bg-background text-xs font-black leading-none text-primary shadow-sm">
                        {item.quantity}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-black leading-tight text-foreground">
                          {item.productName}
                        </span>
                        {item.notes && (
                          <Badge
                            variant="outline"
                            className="mt-1 border-destructive/10 bg-destructive/10/50 px-2 text-[9px] font-bold uppercase italic text-destructive"
                          >
                            OBS: {item.notes}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="flex items-start gap-3 rounded-2xl border border-orange-500/50 bg-orange-500/70 p-4 text-xs text-orange-500">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="font-bold italic leading-relaxed">
                    {order.notes}
                  </p>
                </div>
              )}

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
            </div>
          </Card>
        ))}

        {orders.length === 0 && (
          <div className="flex animate-pulse flex-col items-center justify-center py-24 text-center opacity-40 grayscale">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Utensils className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Sem pedidos ativos
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

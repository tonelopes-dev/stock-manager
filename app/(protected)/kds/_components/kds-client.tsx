"use client";

import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";
import { useState, useMemo } from "react";
import { OrderStatus } from "@prisma/client";
import { Badge } from "@/app/_components/ui/badge";
import {
  Clock,
  CheckCircle2,
  Play,
  Utensils,
  Info,
  Check,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/app/_components/ui/sheet";
import { cn } from "@/app/_lib/utils";

import { useKdsSync } from "../_hooks/use-kds-sync";
import { useKdsActions } from "../_hooks/use-kds-actions";
import { 
  getDerivedStatus, 
  getStationSummary, 
  getPreviousStatus 
} from "../_hooks/kds-engine";
import { KDSColumn } from "./kds-column";

interface KDSClientProps {
  initialOrders: KDSOrderDto[];
  companyId: string;
  environments: EnvironmentOption[];
}

export const KDSClient = ({
  initialOrders,
  companyId,
  environments,
}: KDSClientProps) => {
  const [activeEnvId, setActiveEnvId] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<KDSOrderDto | null>(null);

  // Hook de Sincronização (Estado + Realtime)
  const { orders, pendingUpdates, setOrders } = useKdsSync({ 
    initialOrders, 
    companyId 
  });

  // Hook de Ações (Mutations + Loading States)
  const { 
    handleStatusUpdate, 
    handleItemStatusUpdate, 
    isUpdatingIds 
  } = useKdsActions({
    orders,
    setOrders,
    pendingUpdates,
    companyId,
    activeEnvId,
  });

  // Recalcula o estado derivado dos pedidos baseado na aba ativa
  const filteredOrders = useMemo(() => {
    return orders
      .map((order) => {
        const displayStatus = getDerivedStatus(order, activeEnvId);
        const stationSummary = activeEnvId === "all" ? getStationSummary(order) : [];
        const itemsForThisView = activeEnvId === "all" 
          ? order.items 
          : order.items.filter(i => i.environmentId === activeEnvId);

        if (itemsForThisView.length === 0) return null;

        return {
          ...order,
          items: itemsForThisView,
          displayStatus,
          stationSummary,
        };
      })
      .filter((o): o is NonNullable<typeof o> => o !== null);
  }, [orders, activeEnvId]);

  const columns: {
    title: string;
    status: OrderStatus | OrderStatus[];
    color: string;
    action: OrderStatus | null;
    label: string;
    icon: React.ReactNode | null;
  }[] = [
    {
      title: "Pendentes",
      status: OrderStatus.PENDING,
      color: "bg-orange-500",
      action: OrderStatus.PREPARING,
      label: "Iniciar",
      icon: <Play className="h-4 w-4" />,
    },
    {
      title: "Preparando",
      status: OrderStatus.PREPARING,
      color: "bg-primary",
      action: OrderStatus.READY,
      label: "Pronto",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      title: "Prontos",
      status: OrderStatus.READY,
      color: "bg-emerald-500",
      action: OrderStatus.DELIVERED,
      label: "Entregar",
      icon: <CheckCircle2 className="h-4 w-4 text-background" />,
    },
    {
      title: "Finalizados",
      status: [OrderStatus.DELIVERED, OrderStatus.PAID],
      color: "bg-slate-400",
      action: null,
      label: "OK",
      icon: null,
    },
  ];

  return (
    <div className="flex h-[calc(100vh-150px)] flex-col overflow-hidden bg-slate-50/30">
      <div className="flex items-center justify-between border-b bg-background px-8 py-3">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic tracking-tighter text-foreground">
              KDS <span className="text-primary">PRO</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Sistema de Cozinha
            </span>
          </div>

          <Tabs value={activeEnvId} onValueChange={setActiveEnvId}>
            <TabsList className="h-12 rounded-[1.2rem] border bg-muted/50 p-1.5 shadow-inner">
              <TabsTrigger
                value="all"
                className="rounded-[1rem] px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
              >
                <AlertCircle className="mr-2 h-4 w-4" /> EXPEDIÇÃO
              </TabsTrigger>
              {environments.map((env) => (
                <TabsTrigger
                  key={env.id}
                  value={env.id}
                  className="rounded-[1rem] px-6 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
                >
                  {env.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-4">
          <Badge
            variant="outline"
            className="h-10 gap-2 rounded-2xl border-emerald-200 bg-emerald-50 px-4 text-[10px] font-black text-emerald-700 shadow-sm"
          >
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            REALTIME ATIVO
          </Badge>
        </div>
      </div>

      <div className="scrollbar-hide flex-1 overflow-x-auto p-8">
        <div className="flex h-full gap-8">
          {columns.map((column) => {
            const columnOrders = filteredOrders.filter((order) => {
              if (Array.isArray(column.status)) {
                return column.status.includes(order.displayStatus);
              }
              return order.displayStatus === column.status;
            });

            return (
              <KDSColumn
                key={column.title}
                title={column.title}
                orders={columnOrders}
                accentColor={column.color}
                activeEnvId={activeEnvId}
                actionLabel={column.label}
                actionIcon={column.icon}
                onAction={(id) => handleStatusUpdate(id, column.action as OrderStatus)}
                onItemAction={handleItemStatusUpdate}
                onUndo={(id, status) => {
                  const prev = getPreviousStatus(status);
                  if (prev) handleStatusUpdate(id, prev);
                }}
                onDetail={setSelectedOrder}
                isUpdating={(id) => isUpdatingIds.has(id)}
              />
            );
          })}
        </div>
      </div>

      <Sheet
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <SheetContent className="w-[400px] overflow-y-auto sm:w-[540px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-3xl font-black italic">
              Pedido #{selectedOrder?.orderNumber}
            </SheetTitle>
            <SheetDescription>Detalhes completos da comanda</SheetDescription>
          </SheetHeader>
          {selectedOrder && (
            <div className="space-y-6 pb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-muted p-4">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">
                    Mesa
                  </span>
                  <p className="text-xl font-bold">
                    {selectedOrder.tableNumber || "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted p-4">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">
                    Entrada
                  </span>
                  <p className="font-bold">
                    {formatDistanceToNow(new Date(selectedOrder.createdAt), {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-muted-foreground">
                  Itens do Pedido
                </span>
                <div className="divide-y rounded-2xl border bg-card">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <span className="font-bold">
                          {item.quantity}x {item.productName}
                        </span>
                        {item.notes && (
                          <p className="mt-1 text-sm font-bold text-destructive">
                            OBS: {item.notes}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px] font-bold",
                          item.status === OrderStatus.READY
                            ? "bg-emerald-500"
                            : "bg-slate-200 text-slate-700",
                        )}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase text-muted-foreground">
                    Observações Gerais
                  </span>
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 font-bold italic text-orange-700">
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

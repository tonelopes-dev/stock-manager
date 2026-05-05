"use client";

import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  User,
  Phone,
  MapPin,
  CreditCard,
  MonitorPlay,
  Tv,
  Maximize,
  Minimize,
} from "lucide-react";
import { formatDistanceToNow, differenceInMinutes, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Button } from "@/app/_components/ui/button";
import { useAppMode } from "@/app/_components/app-mode-provider";
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

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING: return "Pendente";
    case OrderStatus.PREPARING: return "Em Preparo";
    case OrderStatus.READY: return "Pronto para Entrega";
    case OrderStatus.DELIVERED: return "Entregue";
    case OrderStatus.PAID: return "Pago";
    case OrderStatus.CANCELED: return "Cancelado";
    default: return status;
  }
};

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
  const { isLiveMode, setIsLiveMode } = useAppMode();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // O estado da praça ativa agora é lido diretamente da URL (?station=...)
  const activeEnvId = searchParams.get("station") || "all";
  
  const [selectedOrder, setSelectedOrder] = useState<KDSOrderDto | null>(null);

  // Função para atualizar a URL quando trocar de aba
  const handleStationChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("station");
    } else {
      params.set("station", value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

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
      status: OrderStatus.DELIVERED,
      color: "bg-slate-400",
      action: null,
      label: "",
      icon: null,
    },
    {
      title: "Pagos",
      status: OrderStatus.PAID,
      color: "bg-emerald-600",
      action: null,
      label: "",
      icon: null,
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50/30">
      <div className="flex items-center justify-between border-b bg-background px-4 py-2 md:px-6 md:py-3 xl:px-8">
        <div className="flex items-center gap-3 md:gap-4 xl:gap-6">
          <div className="flex flex-col">
            <h1 className="text-lg font-black italic tracking-tighter text-foreground xl:text-xl">
              KDS <span className="text-primary">PRO</span>
            </h1>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground md:block">
              Sistema de Cozinha
            </span>
          </div>

          <Tabs value={activeEnvId} onValueChange={handleStationChange}>
            <TabsList className="h-10 rounded-[1.2rem] border bg-muted/50 p-1 shadow-inner md:h-11 xl:h-12 xl:p-1.5">
              <TabsTrigger
                value="all"
                className="rounded-[1rem] px-3 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg md:px-4 md:text-[10px] xl:px-6"
              >
                <AlertCircle className="mr-1.5 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" /> EXPEDIÇÃO
              </TabsTrigger>
              {environments.map((env) => (
                <TabsTrigger
                  key={env.id}
                  value={env.id}
                  className="rounded-[1rem] px-3 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg md:px-4 md:text-[10px] xl:px-6"
                >
                  {env.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2 md:gap-3 xl:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={cn(
              "h-8 gap-2 rounded-2xl border-2 px-3 text-[9px] font-black uppercase tracking-widest transition-all md:h-9 md:px-4 md:text-[10px] xl:h-10 xl:px-6",
              isLiveMode 
                ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" 
                : "border-primary/20 bg-background text-primary hover:bg-primary/5"
            )}
          >
            {isLiveMode ? <Minimize className="h-4 w-4" /> : <MonitorPlay className="h-4 w-4" />}
            <span>{isLiveMode ? "Sair do Live" : "Modo Live"}</span>
          </Button>

          <Badge
            variant="outline"
            className="h-8 gap-1.5 rounded-2xl border-emerald-200 bg-emerald-50 px-2.5 text-[9px] font-black text-emerald-700 shadow-sm md:h-9 md:px-3 md:text-[10px] xl:h-10 xl:px-4"
          >
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">REALTIME</span>
            <span className="hidden md:inline"> ATIVO</span>
          </Badge>
        </div>
      </div>

      <div className="scrollbar-hide flex-1 overflow-x-auto p-3 pb-8 md:p-4 md:pb-10 xl:p-6 xl:pb-14">
        <div className="flex h-full gap-3 md:gap-4 xl:gap-6">
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-[750px]">
          <SheetHeader className="mb-8">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <SheetTitle className="text-3xl font-black italic">
                  Pedido #{selectedOrder?.orderNumber}
                </SheetTitle>
                <SheetDescription className="whitespace-nowrap text-xs">
                  Detalhes completos da comanda
                </SheetDescription>
              </div>
              
              {selectedOrder && (
                <div className="flex justify-start">
                  <Badge className={cn(
                    "h-8 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest",
                    selectedOrder.status === OrderStatus.PAID ? "bg-emerald-500" : 
                    selectedOrder.status === OrderStatus.READY ? "bg-blue-500" :
                    "bg-orange-500"
                  )}>
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </div>
              )}
            </div>
          </SheetHeader>

          {selectedOrder && (
            <div className="space-y-6 pb-8">
              {/* Informações do Cliente */}
              {(selectedOrder.customerName || selectedOrder.customerPhone) && (
                <div className="relative rounded-2xl border bg-slate-50 p-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">
                    <User size={12} /> Cliente
                  </span>
                  <div className="flex items-end justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-lg font-bold text-foreground">
                        {selectedOrder.customerName || "Consumidor"}
                      </p>
                      {selectedOrder.customerPhone && (
                        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                          <Phone size={14} className="text-primary" /> {selectedOrder.customerPhone}
                        </p>
                      )}
                    </div>
                    {selectedOrder.customerPhone && (
                      <a 
                        href={`https://wa.me/55${selectedOrder.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Olá ${selectedOrder.customerName || "cliente"}, seu pedido #${selectedOrder.orderNumber} está com status: ${getStatusLabel(selectedOrder.status)}!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 items-center gap-2 rounded-xl border bg-white px-4 text-[10px] font-black uppercase tracking-wider text-emerald-600 shadow-sm transition-all hover:bg-emerald-50 hover:shadow-md"
                      >
                        <svg 
                          viewBox="0 0 24 24" 
                          width="16" 
                          height="16" 
                          fill="currentColor"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span>Enviar Status</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-muted/50 p-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground mb-1">
                    <MapPin size={12} /> Mesa
                  </span>
                  <p className="text-xl font-black italic text-primary">
                    {selectedOrder.tableNumber || "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/50 p-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground mb-1">
                    <Clock size={12} /> Entrada
                  </span>
                  <p className="font-bold text-foreground">
                    {format(new Date(selectedOrder.createdAt), "HH:mm")}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedOrder.createdAt), {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <Utensils size={12} /> Itens do Pedido
                </span>
                <div className="divide-y rounded-2xl border bg-card shadow-sm">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 transition-colors hover:bg-slate-50/50"
                    >
                      <div className="flex flex-1 items-start gap-4 min-w-0">
                        <span className="flex h-7 min-w-[32px] items-center justify-center rounded-lg bg-slate-100 text-[12px] font-black text-slate-700">
                          {item.quantity}x
                        </span>
                        
                        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-bold text-foreground leading-snug">
                              {item.productName}
                            </span>
                            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                              {item.environmentName}
                            </span>
                          </div>

                          {item.notes && (
                            <div className="mt-1 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 border border-red-100">
                              <AlertCircle size={14} className="mt-0.5 text-red-600 shrink-0" />
                              <p className="text-xs font-bold text-red-700">
                                OBS: {item.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Badge
                        className={cn(
                          "ml-4 shrink-0 h-8 rounded-xl px-3 text-[10px] font-black uppercase tracking-wider",
                          item.status === OrderStatus.READY
                            ? "bg-emerald-500 hover:bg-emerald-600 shadow-sm"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300",
                        )}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Observações Gerais do Pedido
                  </span>
                  <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-orange-50 p-4">
                    <div className="absolute -right-2 -top-2 opacity-10">
                      <Info size={48} className="text-orange-700" />
                    </div>
                    <p className="relative z-10 text-sm font-bold italic text-orange-700">
                      "{selectedOrder.notes}"
                    </p>
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

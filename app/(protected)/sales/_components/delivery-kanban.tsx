"use client";

import { OrderStatus } from "@prisma/client";
import { ComandaDto } from "@/app/_data-access/order/get-active-comandas";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Clock, MapPin, CheckCircle2, PlayCircle, PackageCheck, Loader2 } from "lucide-react";
import { formatCurrency } from "@/app/_helpers/currency";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/app/_lib/utils";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/app/_actions/order/update-status";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DeliveryKanbanProps {
  comandas: ComandaDto[];
  companyId: string;
}

export function DeliveryKanban({ comandas, companyId }: DeliveryKanbanProps) {
  const router = useRouter();
  const [localComandas, setLocalComandas] = useState<ComandaDto[]>(comandas);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Synchronize local state when server props change,
  // but avoid overriding during an optimistic update
  // Synchronize local state when server props change,
  // but avoid overriding a specific order during an optimistic update
  useEffect(() => {
    setLocalComandas(current => {
      // If we are currently updating an order, we must preserve its optimistic state
      if (isUpdating) {
        return comandas.map(serverComanda => {
          const locallyUpdating = current.find(c => c.customerId === isUpdating);
          if (locallyUpdating && serverComanda.customerId === isUpdating) {
            return locallyUpdating;
          }
          return serverComanda;
        });
      }
      return comandas;
    });
  }, [comandas, isUpdating]);

  // SSE Integration for Real-time UI refresh
  useEffect(() => {
    const eventSource = new EventSource(`/api/kds/events?companyId=${companyId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "STATUS_UPDATED" || data.type === "NEW_ORDER") {
          // If the update was for an order we are already managing locally, skip refresh
          // (The local state is handled by the action call)
          if (data.type === "STATUS_UPDATED" && isUpdating === data.orderId) {
            return;
          }
          
          router.refresh(); 
        }
      } catch (e) {
        console.error("Failed to parse SSE message for Delivery Kanban");
      }
    };

    eventSource.onerror = (err) => {
      console.error("Delivery Kanban SSE Error:", err);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [companyId, router]);

  const handleConfirm = async (comanda: ComandaDto) => {
    const pendingOrder = comanda.orders.find(o => o.status === OrderStatus.PENDING);
    if (!pendingOrder) return;

    setIsUpdating(comanda.id);

    // Optimistic UI: Update local state immediately
    const previousComandas = [...localComandas];
    setLocalComandas(prev => 
      prev.map(c => 
        c.id === comanda.id 
          ? { ...c, orders: c.orders.map(o => o.id === pendingOrder.id ? { ...o, status: OrderStatus.PREPARING } : o) }
          : c
      )
    );

    try {
      const result = await updateOrderStatusAction({
        orderId: pendingOrder.id,
        status: OrderStatus.PREPARING,
        companyId,
      });

      if (!result?.data?.success) {
        throw new Error("Falha na atualização");
      }
      
      toast.success("Pedido aceito e enviado para a cozinha!");
    } catch (error) {
      // Rollback on error
      setLocalComandas(previousComandas);
      toast.error("Erro ao aceitar pedido. Tente novamente.");
    } finally {
      // Add a small delay for server props to catch up
      setTimeout(() => setIsUpdating(null), 500);
    }
  };

  const handleDispatch = async (comanda: ComandaDto) => {
    const readyOrder = comanda.orders.find(o => o.status === OrderStatus.READY);
    if (!readyOrder) return;

    setIsUpdating(comanda.id);

    // Optimistic UI
    const previousComandas = [...localComandas];
    setLocalComandas(prev => 
      prev.map(c => 
        c.id === comanda.id 
          ? { ...c, orders: c.orders.map(o => o.id === readyOrder.id ? { ...o, status: OrderStatus.DELIVERED } : o) }
          : c
      )
    );

    try {
      const result = await updateOrderStatusAction({
        orderId: readyOrder.id,
        status: OrderStatus.DELIVERED,
        companyId,
      });

      if (!result?.data?.success) throw new Error();
      toast.success("Pedido despachado!");
    } catch (error) {
      setLocalComandas(previousComandas);
      toast.error("Erro ao despachar pedido.");
    } finally {
      setTimeout(() => setIsUpdating(null), 500);
    }
  };

  // Filter only iFood orders from local state
  const deliveryOrders = localComandas.filter((c) => c.source === "IFOOD");

  const columns: {
    title: string;
    status: OrderStatus[];
    color: string;
    icon: React.ReactNode;
  }[] = [
    {
      title: "Novos",
      status: [OrderStatus.PENDING],
      color: "bg-blue-500",
      icon: <PlayCircle className="h-4 w-4" />,
    },
    {
      title: "Em Preparo",
      status: [OrderStatus.PREPARING],
      color: "bg-orange-500",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: "Prontos para Despacho",
      status: [OrderStatus.READY],
      color: "bg-green-600",
      icon: <PackageCheck className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid h-[calc(100vh-320px)] grid-cols-1 gap-6 overflow-hidden md:grid-cols-3">
      {columns.map((column) => {
        const columnOrders = deliveryOrders.filter((c) =>
          c.orders.some((o) => column.status.includes(o.status))
        );

        return (
          <div key={column.title} className="flex flex-col gap-4 overflow-hidden rounded-xl bg-muted/30 p-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", column.color)} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {column.title}
                </h3>
              </div>
              <Badge variant="secondary" className="bg-background font-bold">
                {columnOrders.length}
              </Badge>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {columnOrders.map((comanda) => (
                <DeliveryCard 
                  key={comanda.id} 
                  comanda={comanda} 
                  onConfirm={() => handleConfirm(comanda)}
                  onDispatch={() => handleDispatch(comanda)}
                  isUpdating={isUpdating === comanda.id}
                />
              ))}
              {columnOrders.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted p-8">
                  <p className="text-xs font-medium text-muted-foreground italic">Nenhum pedido</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DeliveryCardProps {
  comanda: ComandaDto;
  onConfirm: () => void;
  onDispatch: () => void;
  isUpdating: boolean;
}

function DeliveryCard({ comanda, onConfirm, onDispatch, isUpdating }: DeliveryCardProps) {
  const address = comanda.deliveryAddress ? JSON.parse(comanda.deliveryAddress) : null;
  const isNew = comanda.orders.some((o) => o.status === OrderStatus.PENDING);
  const isReady = comanda.orders.some((o) => o.status === OrderStatus.READY);

  return (
    <Card className={cn(
      "relative border-l-4 p-4 transition-all hover:shadow-md",
      isNew ? "border-l-blue-600 ring-2 ring-blue-600/20" : 
      isReady ? "border-l-green-600 ring-2 ring-green-600/20" : "border-l-orange-500"
    )}>
      <div className="mb-3 flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-black uppercase italic leading-none text-foreground line-clamp-1">
            {comanda.customerName}
          </h4>
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
            <Clock size={10} />
            <span>há {formatDistanceToNow(comanda.firstOrderAt, { locale: ptBR })}</span>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-black border-red-200 text-red-600 bg-red-50">
          iFood
        </Badge>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin size={12} className="mt-0.5 text-muted-foreground flex-shrink-0" />
          <p className="text-[10px] font-medium leading-tight text-muted-foreground line-clamp-2">
            {address?.formattedAddress || "Retirada na Loja"}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {comanda.items.map((item, idx) => (
            <span key={idx} className="bg-muted px-1.5 py-0.5 rounded text-[9px] font-bold text-muted-foreground">
              {item.quantity}x {item.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm font-black tracking-tighter text-primary">
          {formatCurrency(comanda.totalAmount + (comanda.deliveryFee || 0))}
        </span>
        
        {isNew ? (
          <Button 
            size="sm" 
            onClick={onConfirm}
            disabled={isUpdating}
            className="h-8 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] gap-1 px-4 min-w-[100px]"
          >
            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <><PlayCircle size={12} /> ACEITAR</>}
          </Button>
        ) : isReady ? (
          <Button 
            size="sm" 
            onClick={onDispatch}
            disabled={isUpdating}
            className="h-8 bg-green-600 hover:bg-green-700 font-bold text-[10px] gap-1 px-4 min-w-[100px]"
          >
            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <><PackageCheck size={12} /> DESPACHAR</>}
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="h-8 font-bold text-[10px]">
            DETALHES
          </Button>
        )}
      </div>
    </Card>
  );
}

"use client";

import { OrderStatus } from "@prisma/client";
import { ComandaDto } from "@/app/_data-access/order/get-active-comandas";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Clock, MapPin, CheckCircle2, PlayCircle, PackageCheck } from "lucide-react";
import { formatCurrency } from "@/app/_helpers/currency";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/app/_lib/utils";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/app/_actions/order/update-status";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from "@/app/_components/ui/sheet";
import { Info, ReceiptText, Truck, ShoppingBag, Loader2 } from "lucide-react";

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
            {comanda.ifoodDisplayId ? `#${comanda.ifoodDisplayId} - ` : ""}{comanda.customerName}
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
        <span className="text-lg font-black tracking-tighter text-primary">
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 font-black text-[10px] border-primary/20 text-primary hover:bg-primary/5">
                <ReceiptText size={12} className="mr-1" />
                DETALHES
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] px-0">
              <SheetHeader className="px-6 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-red-600 font-black text-[10px] border-none">iFood</Badge>
                  <Badge variant="outline" className="font-bold text-[10px] capitalize">
                    {comanda.orders[0]?.status.toLowerCase()}
                  </Badge>
                </div>
                <SheetTitle className="text-2xl font-black italic uppercase tracking-tighter">
                  {comanda.ifoodDisplayId ? `#${comanda.ifoodDisplayId}` : "Pedido"} - {comanda.customerName}
                </SheetTitle>
                <SheetDescription className="text-xs font-medium text-muted-foreground italic">
                  Extrato detalhado do delivery
                </SheetDescription>
              </SheetHeader>

              <div className="h-[calc(100vh-130px)] overflow-y-auto px-6 custom-scrollbar">
                <div className="space-y-8 pb-10">
                  {/* Entrega Section */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Truck size={16} />
                      <h5 className="text-xs font-black uppercase tracking-widest">Informações de Entrega</h5>
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Endereço</p>
                        <p className="text-xs font-bold leading-relaxed text-foreground">
                          {address?.formattedAddress || "Endereço não informado"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Bairro</p>
                          <p className="text-xs font-bold text-foreground">{address?.neighborhood || "-"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Referência</p>
                          <p className="text-xs font-bold text-foreground italic">{address?.reference || "Nenhuma"}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Itens Section */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <ShoppingBag size={16} />
                      <h5 className="text-xs font-black uppercase tracking-widest">Itens do Pedido</h5>
                    </div>
                    <div className="space-y-4">
                      {comanda.items.map((item) => (
                        <div key={item.id} className="group rounded-2xl border bg-background p-4 transition-all hover:border-primary/30">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-[10px] font-black text-background">
                                {item.quantity}
                              </span>
                              <div>
                                <p className="text-xs font-black uppercase leading-tight text-foreground">
                                  {item.name}
                                </p>
                                {item.notes && (
                                  <p className={cn(
                                    "text-[10px] mt-1 font-bold italic",
                                    item.notes.includes("[Item iFood não mapeado]") 
                                      ? "text-red-600 font-extrabold" 
                                      : "text-muted-foreground"
                                  )}>
                                    OBS: {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-black text-muted-foreground">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>

                          {/* Modificadores */}
                          {item.subItems && item.subItems.length > 0 && (
                            <div className="mt-3 ml-9 space-y-2 border-l-2 border-muted pl-4">
                              {item.subItems.map((sub) => (
                                <div key={sub.id} className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold text-muted-foreground/80 lowercase italic">
                                    + {sub.quantity}x {sub.name}
                                  </span>
                                  <span className="font-black text-muted-foreground/60">
                                    {formatCurrency(sub.price * sub.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Financeiro Section */}
                  <section className="space-y-4 pt-4 border-t">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatCurrency(comanda.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-red-600">
                      <span>Taxa de Entrega</span>
                      <span>{formatCurrency(comanda.deliveryFee || 0)}</span>
                    </div>
                    <div className="h-px bg-border w-full" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black uppercase italic tracking-tighter">Total Geral</span>
                      <span className="text-2xl font-black tracking-tighter text-primary">
                        {formatCurrency(comanda.totalAmount + (comanda.deliveryFee || 0))}
                      </span>
                    </div>
                  </section>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </Card>
  );
}

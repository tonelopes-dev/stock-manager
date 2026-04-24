"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/_lib/supabase";


import { OrderStatus } from "@prisma/client";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  ShoppingBag,
  ArrowLeft,
  PackageCheck,
  Plus,
  Loader2,
  Utensils,
  Check
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { OrderStatusDto } from "@/app/_data-access/order/get-order-status";
import { getMyOrdersAction } from "@/app/_actions/order/get-my-orders";
import { cn } from "@/app/_lib/utils";

interface MyOrdersClientProps {
  companyId: string;
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    icon: any;
    color: string;
    description: string;
    step: number;
  }
> = {
  PENDING: {
    label: "Pendente",
    icon: Clock,
    color: "text-muted-foreground",
    description: "Aguardando confirmação",
    step: 1,
  },
  PREPARING: {
    label: "Preparando",
    icon: ChefHat,
    color: "text-primary",
    description: "No fogo!",
    step: 2,
  },
  READY: {
    label: "Pronto",
    icon: PackageCheck,
    color: "text-green-500",
    description: "Saia para saborear!",
    step: 3,
  },
  DELIVERED: {
    label: "Entregue",
    icon: ShoppingBag,
    color: "text-primary",
    description: "Entregue na mesa!",
    step: 4,
  },
  PAID: {
    label: "Pago",
    icon: CheckCircle2,
    color: "text-green-600",
    description: "Finalizado.",
    step: 5,
  },
  CANCELED: {
    label: "Cancelado",
    icon: Clock,
    color: "text-destructive",
    description: "Infelizmente cancelado.",
    step: 0,
  },
};

const itemStatusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pendente", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Clock },
  PREPARING: { label: "Preparando", color: "bg-primary/10 text-primary border-primary/20", icon: ChefHat },
  READY: { label: "Pronto", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  DELIVERED: { label: "Entregue", color: "bg-primary/10 text-primary border-primary/20", icon: Check },
  PAID: { label: "Pago", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Check },
  CANCELED: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Clock },
};

const OrderCard = ({
  order,
  companyId,
}: {
  order: OrderStatusDto;
  companyId: string;
}) => {
  const currentStatus = statusConfig[order.status];
  const formatPrice = (price: number) =>
    Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      price,
    );

  return (
    <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white p-8 shadow-2xl shadow-gray-200/50 transition-all hover:shadow-gray-300/50">
      {/* Header: Order # and Icon */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tighter text-gray-900">
            PEDIDO #{order.orderNumber}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs font-bold text-gray-400">
            <span>
              {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="h-1 w-1 rounded-full bg-gray-200" />
            <span>{order.items.reduce((acc, i) => acc + i.quantity, 0)} itens</span>
          </div>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gray-50",
            currentStatus.color
          )}
        >
          <currentStatus.icon className="h-6 w-6" />
        </div>
      </div>

      {/* Status Bar & Label */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-black text-gray-900 uppercase tracking-tight">
            {currentStatus.label}
          </p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {currentStatus.description}
          </p>
        </div>

        {/* Mini Stepper */}
        {order.status !== "CANCELED" && (
          <div className="flex items-center gap-1.5 px-0.5">
            {[1, 2, 3, 4, 5].map((step) => {
              const isActive = currentStatus.step >= step;
              const isCurrent = currentStatus.step === step;
              return (
                <div
                  key={step}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-all duration-700",
                    isActive 
                      ? isCurrent ? "bg-primary animate-pulse" : "bg-primary"
                      : "bg-gray-100"
                  )}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Item List (Transparency) */}
      <div className="mt-8 space-y-4 border-t border-gray-50 pt-6">
        <div className="space-y-4">
          {order.items.map((item, idx) => {
            const config = itemStatusConfig[item.status as OrderStatus] || itemStatusConfig.PENDING;
            const ItemIcon = config.icon;
            
            return (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-[10px] font-black text-white">
                      {item.quantity}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-gray-800 leading-tight">
                        {item.name}
                      </span>
                      {item.notes && (
                        <span className="text-[10px] italic text-gray-400 leading-tight">
                          "{item.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
                
                {/* Granular Item Status Badge */}
                <div className="ml-9">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "h-6 gap-1.5 px-2.5 text-[9px] font-black uppercase tracking-wider border",
                      config.color
                    )}
                  >
                    <ItemIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Footer */}
        <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Pago</span>
          <span className="text-lg font-black text-primary">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>
    </Card>
  );
};

export const MyOrdersClient = ({ companyId }: MyOrdersClientProps) => {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);


  const loadOrders = async (cid: string) => {
    try {
      const result = await getMyOrdersAction({
        companyId,
        customerId: cid,
      });
      if (result?.data?.orders) {
        setOrders(result.data.orders);
      }
    } catch (e) {
      console.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedCustomer = localStorage.getItem(`kipo-customer-${companyId}`);
    
    if (!savedCustomer) {
      setLoading(false);
      return;
    }

    try {
      const customer = JSON.parse(savedCustomer);
      setCustomerId(customer.customerId);
      loadOrders(customer.customerId);
    } catch (e) {
      setLoading(false);
    }
  }, [companyId]);

  // Supabase Realtime - Native Postgres Changes
  useEffect(() => {
    const channel = supabase
      .channel("customer-order-updates")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "Order" 
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as any;
            setOrders((prev) =>
              prev.map((order) =>
                order.id === updatedOrder.id ? { ...order, status: updatedOrder.status } : order
              )
            );
          }
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "OrderItem" 
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as any;
            setOrders((prev) =>
              prev.map((order) => {
                if (order.id !== updatedItem.orderId) return order;
                return {
                  ...order,
                  items: order.items.map((item) =>
                    item.id === updatedItem.id ? { ...item, status: updatedItem.status } : item
                  ),
                };
              })
            );
          }
          if (payload.eventType === "DELETE") {
            const oldItem = payload.old as any;
            setOrders((prev) =>
              prev.map((order) => ({
                ...order,
                items: order.items.filter((item) => item.id !== oldItem.id),
              })).filter((order) => order.items.length > 0)
            );
          }
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50/50 font-sans shadow-2xl">
      <header className="sticky top-0 z-20 bg-white/95 px-6 pb-6 pt-10 shadow-sm backdrop-blur-md">
        <Link
          href={`/menu/${companyId}`}
          className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o Cardápio
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Meus Pedidos
          </h1>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-black text-white">
            {orders.length}
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-6 py-8 pb-32">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-background shadow-xl shadow-slate-200/50">
              <Utensils className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Você ainda não tem pedidos
            </h3>
            <p className="mt-2 max-w-[200px] text-sm text-muted-foreground">
              Seus pedidos aparecerão aqui quando você finalizar sua compra.
            </p>
            <Link href={`/menu/${companyId}`} className="mt-8">
              <Button className="rounded-2xl bg-foreground px-8 text-xs font-black uppercase tracking-widest text-background shadow-xl hover:bg-foreground">
                Ver Cardápio
              </Button>
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} companyId={companyId} />
          ))
        )}
      </main>

      <footer className="fixed bottom-0 left-1/2 z-30 w-[calc(100%-48px)] max-w-[calc(448px-48px)] -translate-x-1/2 pb-10">
        <Link href={`/menu/${companyId}`}>
          <Button className="h-16 w-full rounded-[2rem] bg-foreground px-8 text-lg font-black italic text-background shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-foreground active:scale-95">
            <Plus className="mr-3 h-6 w-6" />
            NOVO PEDIDO
          </Button>
        </Link>
      </footer>
    </div>
  );
};

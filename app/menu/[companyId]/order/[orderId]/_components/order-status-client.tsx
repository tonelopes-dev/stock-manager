"use client";

import { useEffect, useState } from "react";
import { OrderStatus } from "@prisma/client";
import { supabase } from "@/app/_lib/supabase";

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
  Utensils,
  X,
  Bell,
  BellOff,
  BellRing,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { OrderStatusDto } from "@/app/_data-access/order/get-order-status";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface OrderStatusClientProps {
  initialOrder: OrderStatusDto;
  companyId: string;
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    icon: any;
    color: string;
    bgColor: string;
    description: string;
    step: number;
  }
> = {
  PENDING: {
    label: "Recebido",
    icon: Clock,
    color: "text-gray-400",
    bgColor: "bg-gray-50",
    description: "Seu pedido chegou na nossa cozinha.",
    step: 1,
  },
  PREPARING: {
    label: "No Fogo",
    icon: ChefHat,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    description: "Preparando com carinho e fogo alto!",
    step: 2,
  },
  READY: {
    label: "Pronto",
    icon: PackageCheck,
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "Hora de saborear! Já pode ser servido.",
    step: 3,
  },
  DELIVERED: {
    label: "Entregue",
    icon: Utensils,
    color: "text-primary",
    bgColor: "bg-primary/5",
    description: "Aproveite cada mordida!",
    step: 4,
  },
  PAID: {
    label: "Finalizado",
    icon: CheckCircle2,
    color: "text-gray-900",
    bgColor: "bg-gray-100",
    description: "Obrigado! Volte sempre ao nosso restaurante.",
    step: 5,
  },
  CANCELED: {
    label: "Cancelado",
    icon: X,
    color: "text-destructive",
    bgColor: "bg-destructive/5",
    description: "Infelizmente este pedido foi cancelado.",
    step: 0,
  },
};

export const OrderStatusClient = ({
  initialOrder,
  companyId,
}: OrderStatusClientProps) => {
  const router = useRouter();
  const [order, setOrder] = useState<OrderStatusDto>(initialOrder);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  // Notification Permission Handling
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast.success("Você será avisado quando o pedido estiver pronto! 🔔");
      }
    }
  };

  // Supabase Realtime - Native Postgres Changes
  useEffect(() => {
    const channel = supabase
      .channel(`order-status-${order.id}`)
      .on(
        "postgres_changes",
        { 
          event: "UPDATE", 
          schema: "public", 
          table: "Order",
          filter: `id=eq.${order.id}`
        },
        (payload) => {
          const updatedOrder = payload.new as any;
          setOrder((prev) => ({ ...prev, status: updatedOrder.status }));
          router.refresh();

          // Native Notification trigger
          if (updatedOrder.status === "READY" && typeof window !== "undefined" && Notification.permission === "granted") {
            new Notification("Pedido Pronto! 🍽️", {
              body: "Seu pedido já pode ser servido. Bom apetite!",
              icon: "/favicon.ico",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, router]);

  const currentStatus = statusConfig[order.status];
  const formatPrice = (price: number) =>
    Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-[#F8F9FA] font-sans shadow-2xl">
      {/* Premium Tracking Header */}
      <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-gray-100 bg-white/80 px-6 pb-4 pt-10 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <Link
            href={`/menu/${companyId}`}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Cardápio
          </Link>
          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-[10px] font-black uppercase text-gray-500">
            Mesa {order.tableNumber || "N/A"}
          </Badge>
        </div>
        <div className="flex items-end justify-between">
          <h1 className="text-3xl font-black italic leading-none tracking-tighter text-gray-900">
            PEDIDO <span className="text-primary">#{order.orderNumber}</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase">
            {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </header>

      <main className="flex-1 space-y-8 px-6 py-8">
        {/* Hero Status Card */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-white p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full ${currentStatus.bgColor} ${currentStatus.color} transition-all duration-700`}>
            <currentStatus.icon className="h-12 w-12 animate-in zoom-in-50 duration-500" />
          </div>
          <h2 className={`text-3xl font-black tracking-tight ${currentStatus.color}`}>
            {currentStatus.label}
          </h2>
          <p className="mt-2 text-sm font-medium text-gray-400">
            {currentStatus.description}
          </p>

          {/* Native Notification Opt-in */}
          {notificationPermission !== "granted" && order.status !== "PAID" && (
            <button
              onClick={requestNotificationPermission}
              className="mt-8 flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all"
            >
              {notificationPermission === "denied" ? (
                <><BellOff className="h-4 w-4" /> Notificações Bloqueadas</>
              ) : (
                <><BellRing className="h-4 w-4" /> Me avise quando estiver pronto</>
              )}
            </button>
          )}
        </section>

        {/* Immersive Progress Timeline */}
        {order.status !== "CANCELED" && (
          <div className="px-4">
             <div className="flex items-center justify-between relative">
               {/* Timeline Background Line */}
               <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-100 -z-0" />
               
               {[1, 2, 3, 4, 5].map((step) => {
                 const isActive = currentStatus.step >= step;
                 const isCurrent = currentStatus.step === step;
                 return (
                   <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                     <div
                       className={`flex h-10 w-10 items-center justify-center rounded-full border-4 transition-all duration-700 ${
                         isActive
                           ? "border-white bg-gray-900 text-white shadow-lg"
                           : "border-white bg-gray-100 text-gray-300"
                       } ${isCurrent ? "scale-125 ring-4 ring-gray-900/5" : ""}`}
                     >
                       {isActive && currentStatus.step > step ? (
                         <CheckCircle2 className="h-4 w-4" />
                       ) : (
                         <span className="text-[10px] font-black">{step}</span>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
             <div className="mt-4 flex justify-between px-1">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Fila</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Finalizado</span>
             </div>
          </div>
        )}

        {/* Order Summary Refined */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Resumo da Experiência
          </h3>
          <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="space-y-5">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <span className="text-sm font-black text-primary">{item.quantity}x</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{item.name}</span>
                      {item.notes && (
                        <span className="mt-1 text-[10px] font-bold text-destructive bg-destructive/5 px-2 py-0.5 rounded-md w-fit">
                          {item.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="mt-6 border-t border-gray-50 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-gray-900">Total</span>
                  <span className="text-2xl font-black text-primary">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Upsell / Branding */}
        <Card className="group relative flex items-center gap-5 overflow-hidden rounded-[2.5rem] border-none bg-gray-900 p-8 text-white shadow-2xl">
           <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/20 blur-2xl group-hover:bg-primary/40 transition-all duration-700" />
           <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-white/10 backdrop-blur-md">
             <Plus className="h-6 w-6 text-primary" />
           </div>
           <div className="flex-1">
             <h4 className="text-md font-black">Ainda com fome?</h4>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
               Adicione mais itens ao seu banquete.
             </p>
           </div>
           <Link href={`/menu/${companyId}`}>
             <Button className="h-12 w-12 rounded-2xl bg-white text-gray-900 hover:bg-gray-100 hover:scale-110 transition-all">
               <Plus className="h-5 w-5" />
             </Button>
           </Link>
        </Card>
      </main>

      <footer className="py-12 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
          KIPO • PREMIUM GUEST EXPERIENCE
        </p>
      </footer>
    </div>
  );
};

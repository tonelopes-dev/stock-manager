"use client";

/**
 * OrderTrackerClient - Premium Real-time Order Tracking Component
 */

import { useEffect, useState } from "react";
import { OrderStatus } from "@prisma/client";
import { supabase } from "@/app/_lib/supabase";
import { 
  Clock, 
  Flame, 
  CheckCircle2, 
  ArrowLeft, 
  ShoppingBag, 
  MapPin, 
  UtensilsCrossed 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/app/_components/ui/badge";
import { Card } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { OrderStatusDto } from "@/app/_data-access/order/get-order-status";
import { cn } from "@/app/_lib/utils";

interface OrderTrackerClientProps {
  initialOrder: OrderStatusDto;
  companyName: string;
  companyLogo: string | null;
  companySlug: string;
}

// Simple Fallback for XCircle if not imported
const XCircle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const statusConfig: Record<OrderStatus, {
  label: string;
  description: string;
  icon: any;
  step: number;
  color: string;
}> = {
  PENDING: {
    label: "Recebido",
    description: "Seu pedido chegou na nossa cozinha.",
    icon: Clock,
    step: 1,
    color: "text-gray-400",
  },
  PREPARING: {
    label: "Preparando",
    description: "Seu pedido está sendo preparado com carinho.",
    icon: Flame,
    step: 2,
    color: "text-orange-500",
  },
  READY: {
    label: "Pronto",
    description: "Tudo pronto! Já pode saborear.",
    icon: CheckCircle2,
    step: 3,
    color: "text-green-500",
  },
  DELIVERED: {
    label: "Entregue",
    description: "Espero que aproveite cada mordida!",
    icon: ShoppingBag,
    step: 4,
    color: "text-blue-500",
  },
  PAID: {
    label: "Finalizado",
    description: "Obrigado e volte sempre!",
    icon: UtensilsCrossed,
    step: 4,
    color: "text-primary",
  },
  CANCELED: {
    label: "Cancelado",
    description: "Infelizmente este pedido foi cancelado.",
    icon: XCircle,
    step: 0,
    color: "text-destructive",
  },
};

export function OrderTrackerClient({ initialOrder, companyName, companyLogo, companySlug }: OrderTrackerClientProps) {
  const [order, setOrder] = useState<OrderStatusDto>(initialOrder);

  useEffect(() => {
    const channel = supabase
      .channel(`order-tracker-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const updatedOrder = payload.new as any;
          // Merge payload with previous order to keep items (which aren't in payload.new)
          setOrder((prev) => ({ 
            ...prev, 
            status: updatedOrder.status,
            totalAmount: Number(updatedOrder.totalAmount),
            tableNumber: updatedOrder.tableNumber
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  const currentStatus = statusConfig[order.status] || statusConfig.PENDING;
  const steps = [
    { id: 'PENDING', label: 'Recebido', icon: Clock },
    { id: 'PREPARING', label: 'Preparando', icon: Flame },
    { id: 'READY', label: 'Pronto', icon: CheckCircle2 },
  ];

  return (
    <div className="mx-auto flex max-w-md flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex flex-col gap-4">
        <Link 
          href={`/${companySlug}`}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors border border-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 leading-none">
              #<span className="text-primary">{order.orderNumber}</span>
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              Pedido Recebido!
            </p>
          </div>
          {companyLogo && (
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <Image src={companyLogo} alt={companyName} fill className="object-cover" />
            </div>
          )}
        </div>
      </header>

      {/* Real-time Status Card */}
      <main className="flex-1 px-6 pb-20 space-y-8">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 p-10 text-center shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16" />
          
          <div className={cn(
            "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-md",
            order.status === 'PREPARING' && "animate-pulse ring-4 ring-primary/30"
          )}>
            <currentStatus.icon className={cn("h-10 w-10", currentStatus.color)} />
          </div>
          
          <h2 className="text-2xl font-black tracking-tight text-white">
            {currentStatus.label}
          </h2>
          <p className="mt-2 text-sm font-medium text-gray-400 px-4">
            {currentStatus.description}
          </p>
        </section>

        {/* Horizontal Stepper */}
        <div className="px-2">
          <div className="relative flex items-center justify-between">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-gray-100" />
            
            {steps.map((step, idx) => {
              const config = statusConfig[step.id as OrderStatus];
              const isActive = currentStatus.step >= config.step;
              const isCurrent = currentStatus.step === config.step;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-4 transition-all duration-500",
                    isActive ? "border-white bg-gray-900 text-white shadow-lg" : "border-white bg-gray-100 text-gray-300",
                    isCurrent && "scale-110 ring-4 ring-primary/20"
                  )}>
                    <step.icon className={cn("h-5 w-5", isCurrent && "animate-pulse")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tighter",
                    isActive ? "text-gray-900" : "text-gray-300"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <ShoppingBag className="w-3 h-3" />
              RESUMO DO PEDIDO
            </h3>
            {order.tableNumber && (
              <Badge variant="outline" className="rounded-lg border-gray-100 bg-gray-50 text-[10px] font-black uppercase text-gray-500">
                MESA {order.tableNumber}
              </Badge>
            )}
          </div>
          
          <Card className="rounded-[2rem] border-gray-100 bg-white p-6 shadow-sm overflow-hidden">
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <span className="text-sm font-black text-primary bg-primary/5 w-6 h-6 flex items-center justify-center rounded-md">
                      {item.quantity}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none">{item.name}</p>
                      {item.notes && <p className="text-[10px] italic text-gray-400 mt-1">"{item.notes}"</p>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.price * item.quantity)}
                  </span>
                </div>
              ))}

              <div className="pt-4 mt-2 border-t border-dashed border-gray-100 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Total Pago</span>
                  <span className="text-2xl font-black text-gray-900 leading-none mt-1">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-green-500 bg-green-50 px-3 py-1.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  PEDIDO ATIVO
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Support Footer */}
        <div className="text-center py-4">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            Precisa de ajuda? Fale com um atendente.
          </p>
        </div>
      </main>
    </div>
  );
}

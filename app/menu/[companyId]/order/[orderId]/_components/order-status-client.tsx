"use client";

import { useEffect, useState } from "react";
import { OrderStatus } from "@prisma/client";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  PackageCheck,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { OrderStatusDto } from "@/app/_data-access/order/get-order-status";

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
    description: string;
    step: number;
  }
> = {
  PENDING: {
    label: "Pendente",
    icon: Clock,
    color: "text-muted-foreground",
    description: "Aguardando confirmação da cozinha",
    step: 1,
  },
  PREPARING: {
    label: "Preparando",
    icon: ChefHat,
    color: "text-primary",
    description: "Seu pedido já está no fogo!",
    step: 2,
  },
  READY: {
    label: "Pronto",
    icon: PackageCheck,
    color: "text-green-500",
    description: "Hora de saborear! Seu pedido está pronto.",
    step: 3,
  },
  DELIVERED: {
    label: "Entregue",
    icon: ShoppingBag,
    color: "text-primary",
    description: "Seu pedido foi entregue na mesa!",
    step: 4,
  },
  PAID: {
    label: "Pago",
    icon: CheckCircle2,
    color: "text-green-600",
    description: "Pedido finalizado e pago.",
    step: 5,
  },
  CANCELED: {
    label: "Cancelado",
    icon: Clock,
    color: "text-destructive",
    description: "Infelizmente seu pedido foi cancelado.",
    step: 0,
  },
};

export const OrderStatusClient = ({
  initialOrder,
  companyId,
}: OrderStatusClientProps) => {
  const [order, setOrder] = useState<OrderStatusDto>(initialOrder);

  // Real-time updates via Resilient SSE
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;

    const connect = () => {
      if (eventSource) eventSource.close();

      // Passing companyId in query param because customers don't have an ERP session
      eventSource = new EventSource(`/api/kds/stream?companyId=${companyId}`);

      eventSource.onopen = () => {
        retryCount = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          
          if (data.type === "STATUS_UPDATED" && data.orderId === order.id) {
            setOrder((prev) => ({ ...prev, status: data.status }));
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
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
  }, [companyId, order.id]);

  const currentStatus = statusConfig[order.status];
  const formatPrice = (price: number) =>
    Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      price,
    );

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-muted font-sans shadow-2xl">
      {/* Header */}
      <header className="bg-background px-6 pb-6 pt-10 shadow-sm">
        <Link
          href={`/menu/${companyId}`}
          className="mb-6 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          VOLTAR PARA O MENU
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-foreground">
              PEDIDO #{order.orderNumber}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-muted ${currentStatus.color}`}
          >
            <currentStatus.icon className="h-6 w-6" />
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-6 py-8">
        {/* Status Card */}
        <Card className="overflow-hidden rounded-[2rem] border-none bg-background p-8 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted ${currentStatus.color}`}
            >
              <currentStatus.icon className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {currentStatus.label}
            </h2>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {currentStatus.description}
            </p>
          </div>

          {/* Progress Steps */}
          {order.status !== "CANCELED" && (
            <div className="mt-10 flex items-center justify-between px-2">
              {[1, 2, 3, 4, 5].map((step) => {
                const isActive = currentStatus.step >= step;
                const isCompleted = currentStatus.step > step;
                return (
                  <div
                    key={step}
                    className="relative flex flex-col items-center gap-2"
                  >
                    <div
                      className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 transition-all duration-500 ${
                        isActive
                          ? "border-primary bg-primary text-background"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-xs font-black">{step}</span>
                      )}
                    </div>
                    {/* Line */}
                    {step < 4 && (
                      <div
                        className={`absolute left-[2.5rem] top-5 h-1 w-[calc(100%+1.5rem)] -translate-y-1/2 ${
                          currentStatus.step > step
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Order Items */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Resumo do Pedido
          </h3>
          <Card className="rounded-[2rem] border-none bg-background p-6 shadow-lg shadow-slate-200/30">
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-[10px] font-black text-foreground">
                      {item.quantity}x
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="my-2 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-foreground">
                    Total
                  </span>
                  <span className="text-xl font-black text-primary">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="flex items-center gap-4 rounded-[2rem] border-none bg-foreground p-6 text-background shadow-xl shadow-slate-900/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/10">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black">Ainda com fome?</h4>
            <p className="text-[10px] font-medium text-muted-foreground">
              Você pode adicionar mais itens ao seu pedido voltando ao cardápio.
            </p>
          </div>
          <Link href={`/menu/${companyId}`}>
            <Button
              size="icon"
              className="h-10 w-10 rounded-xl bg-primary p-0 text-background hover:bg-primary"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </Link>
        </Card>
      </main>

      <footer className="p-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Powered by Kipo
        </p>
      </footer>
    </div>
  );
};

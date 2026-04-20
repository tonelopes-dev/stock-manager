"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { OrderStatusDto } from "@/app/_data-access/order/get-order-status";
import { getMyOrdersAction } from "@/app/_actions/order/get-my-orders";

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
    <Card className="overflow-hidden rounded-[2.5rem] border-none bg-background p-6 shadow-xl shadow-slate-200/50">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-black italic tracking-tighter text-foreground">
            PEDIDO #{order.orderNumber}
          </h3>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">
            {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            • {order.items.length} {order.items.length === 1 ? "item" : "itens"}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-muted ${currentStatus.color}`}
        >
          <currentStatus.icon className="h-5 w-5" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-foreground">
            {currentStatus.label}
          </span>
          <span className="text-sm font-black text-primary">
            {formatPrice(order.totalAmount)}
          </span>
        </div>

        {/* Mini Stepper */}
        {order.status !== "CANCELED" && (
          <div className="flex items-center justify-between px-1">
            {[1, 2, 3, 4, 5].map((step) => {
              const isActive = currentStatus.step >= step;
              return (
                <div
                  key={step}
                  className="relative flex flex-1 items-center justify-center"
                >
                  <div
                    className={`z-10 h-2 w-full rounded-full transition-all duration-700 ${
                      isActive ? "bg-primary" : "bg-muted"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export const MyOrdersClient = ({ companyId }: MyOrdersClientProps) => {
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

  // Real-time updates via Resilient SSE
  useEffect(() => {
    if (!customerId) return;

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

          // Se for um evento deste cliente específico
          if (data.customerId === customerId) {
            if (data.type === "STATUS_UPDATED") {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === data.orderId ? { ...o, status: data.status } : o,
                ),
              );
            } else if (data.type === "NEW_ORDER") {
              loadOrders(customerId);
            }
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
  }, [companyId, customerId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-muted font-sans shadow-2xl">
      <header className="sticky top-0 z-20 bg-background/90 px-6 pb-6 pt-10 shadow-sm backdrop-blur-md">
        <Link
          href={`/menu/${companyId}`}
          className="mb-6 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          VOLTAR PARA O MENU
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-foreground">
            Meus Pedidos
          </h1>
          <Badge className="rounded-full bg-primary px-3 font-black text-background">
            {orders.length}
          </Badge>
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

"use client";

import { OrderStatusDto } from "@/app/_data-access/order/get-order-status";
import { OrderCard } from "./order-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { useMemo } from "react";
import { Utensils, Zap, Loader2 } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { generateInfinityPayCheckout } from "@/app/_actions/integration/generate-infinitypay-checkout";
import { toast } from "sonner";

interface OrdersTabGroupProps {
  orders: OrderStatusDto[];
  companyId: string;
  companySlug: string;
  infinityPayEnabled: boolean;
}

export function OrdersTabGroup({ orders, companyId, companySlug, infinityPayEnabled }: OrdersTabGroupProps) {
  // 1. Group orders
  const groupedOrders = useMemo(() => {
    const active = orders.filter((o) => ["PENDING", "PREPARING", "READY", "DELIVERED"].includes(o.status));
    const pendingPayment = orders.filter((o) => o.status === "SETTLED_LATER");
    const history = orders.filter((o) => ["PAID", "CANCELED"].includes(o.status));

    return { active, pendingPayment, history };
  }, [orders]);

  const activeOrdersTotal = useMemo(() => {
    return groupedOrders.active.reduce((acc, order) => acc + Number(order.totalAmount), 0);
  }, [groupedOrders.active]);

  const { execute: payNow, isExecuting: isGeneratingCheckout } = useAction(generateInfinityPayCheckout, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        window.location.href = data.url; 
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Não foi possível gerar o link de pagamento.");
    }
  });

  const handlePayComanda = () => {
    const activeOrderIds = groupedOrders.active.map(o => o.id);
    if (activeOrderIds.length > 0) {
      payNow({ orderIds: activeOrderIds, companyId });
    }
  };

  // Determine initial tab based on where there are orders
  const defaultTab = groupedOrders.pendingPayment.length > 0 
    ? "pending" 
    : groupedOrders.active.length > 0 
      ? "active" 
      : "history";

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-slate-200/50">
          <Utensils className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">
          Você ainda não tem pedidos
        </h3>
        <p className="mt-2 max-w-[200px] text-sm text-muted-foreground">
          Seus pedidos aparecerão aqui quando você finalizar sua compra.
        </p>
        <Link href={`/${companySlug}`} className="mt-8">
          <Button className="rounded-2xl bg-foreground px-8 text-xs font-black uppercase tracking-widest text-background shadow-xl hover:bg-foreground">
            Ver Cardápio
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Tabs defaultValue={defaultTab} className="w-full space-y-6">
      <TabsList className="w-full h-14 bg-white/50 backdrop-blur-md rounded-full border border-gray-100 shadow-sm p-1 grid grid-cols-3">
        <TabsTrigger 
          value="active" 
          className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-xs font-black uppercase tracking-widest transition-all"
        >
          Ativas
          {groupedOrders.active.length > 0 && (
            <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px]">
              {groupedOrders.active.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="pending" 
          className="rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-xs font-black uppercase tracking-widest transition-all"
        >
          A Pagar
          {groupedOrders.pendingPayment.length > 0 && (
            <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white animate-pulse text-[9px]">
              {groupedOrders.pendingPayment.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="history" 
          className="rounded-full data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:shadow-md text-xs font-black uppercase tracking-widest transition-all"
        >
          Histórico
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {groupedOrders.active.length === 0 ? (
          <p className="text-center text-sm font-medium text-muted-foreground py-10">
            Nenhuma comanda em andamento.
          </p>
        ) : (
          <div className="space-y-6">
            {groupedOrders.active.map((order) => (
              <OrderCard key={order.id} order={order} companyId={companyId} companySlug={companySlug} infinityPayEnabled={infinityPayEnabled} />
            ))}
            
            {infinityPayEnabled && (
              <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <div className="mx-auto max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-gray-500">Total da Comanda</span>
                    <span className="text-xl font-black text-gray-900">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(activeOrdersTotal)}
                    </span>
                  </div>
                  <Button 
                    onClick={handlePayComanda}
                    disabled={isGeneratingCheckout}
                    className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20"
                  >
                    {isGeneratingCheckout ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Fechar Comanda
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="pending" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {groupedOrders.pendingPayment.length === 0 ? (
          <p className="text-center text-sm font-medium text-muted-foreground py-10">
            Você não tem pendências de pagamento.
          </p>
        ) : (
          groupedOrders.pendingPayment.map((order) => (
            <OrderCard key={order.id} order={order} companyId={companyId} companySlug={companySlug} infinityPayEnabled={infinityPayEnabled} />
          ))
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {groupedOrders.history.length === 0 ? (
          <p className="text-center text-sm font-medium text-muted-foreground py-10">
            Nenhum histórico de pedidos.
          </p>
        ) : (
          groupedOrders.history.map((order) => (
            <OrderCard key={order.id} order={order} companyId={companyId} companySlug={companySlug} />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

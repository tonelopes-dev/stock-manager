"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/_lib/supabase";
import { usePushNotifications } from "@/app/_hooks/use-push-notifications";

import { ArrowLeft, BellRing, Loader2, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { OrderStatusDto } from "@/app/_data-access/order/get-order-status";
import { getMyOrdersAction } from "@/app/_actions/order/get-my-orders";
import { formatPhoneNumber } from "@/app/_lib/utils";
import { toast } from "sonner";
import { BottomNav } from "../../_components/layout/bottom-nav";
import { PromotionsModal } from "../../_components/promotions/promotions-modal";
import { ProductDetailsSheet } from "../../_components/product/product-details-sheet";
import { FloatingCartButton } from "../../_components/cart/floating-cart-button";
import { useUIStore } from "../../_store/use-ui-store";
import { OrdersTabGroup } from "./orders-tab-group";

interface MyOrdersClientProps {
  companyId: string;
  companySlug: string;
  paymentGatewayConfig?: { provider: string; publicKey?: string } | null;
}

export const MyOrdersClient = ({ companyId, companySlug, paymentGatewayConfig }: MyOrdersClientProps) => {
  const router = useRouter();
  const { openPromotionsModal } = useUIStore();
  const [orders, setOrders] = useState<OrderStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Login flow state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  // Push Notifications
  const { permission: pushPermission, isSubscribed, isLoading: pushLoading, requestPermissionAndSubscribe } = usePushNotifications({
    customerId,
    companyId,
    autoSubscribe: true,
  });

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
      setIsLoggedIn(true);
      loadOrders(customer.customerId);
    } catch (e) {
      setLoading(false);
    }
  }, [companyId]);

  const handleLoginContinue = async () => {
    const cleanPhone = loginPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Informe um telefone válido.");
      return;
    }

    setIsCheckingPhone(true);
    try {
      const res = await fetch(`/api/customers/check?phone=${cleanPhone}&companyId=${companyId}`);
      const data = await res.json();

      if (data.exists) {
        localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify(data.customer));
        setCustomerId(data.customer.customerId);
        setIsLoggedIn(true);
        toast.success(`Bem-vindo(a) de volta, ${data.customer.name.split(' ')[0]}!`);
        loadOrders(data.customer.customerId);
      } else {
        toast.info("Não encontramos pedidos para este telefone. Se deseja criar uma conta, acesse o Perfil ou faça seu primeiro pedido!");
      }
    } catch {
      toast.error("Erro ao buscar histórico.");
    } finally {
      setIsCheckingPhone(false);
    }
  };

  // Supabase Realtime - Sync order status in real-time (Migrado para Broadcast)
  useEffect(() => {
    if (!companyId || !customerId) return;

    // Conecta como canal público (ack: false) para contornar bloqueio de RLS anon
    const channel = supabase
      .channel(`customer-${customerId}`, { config: { broadcast: { ack: false } } })
      .on(
        "broadcast",
        { event: "order_status_update" },
        (payload: any) => {
          console.log("🔄 My Orders Realtime Broadcast:", payload);
          // Quando o status do pedido muda no banco, atualizamos a tela
          loadOrders(customerId);
          router.refresh();
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ My Orders Realtime: Subscribed", { customerId });
        }
        if (status === "CHANNEL_ERROR") {
          console.error("❌ My Orders Realtime: Channel Error:", err);
        }
        if (status === "TIMED_OUT") {
          console.warn("⚠️ My Orders Realtime: Connection Timed Out");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, customerId]); // Removido router para evitar resubscriptions desnecessárias


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
          href={`/${companySlug}`}
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
        {/* Push Notification Opt-in Banner */}
        {isLoggedIn && pushPermission !== "granted" && pushPermission !== "unsupported" && pushPermission !== "denied" && (
          <button
            onClick={async () => {
              const success = await requestPermissionAndSubscribe();
              if (success) {
                toast.success("Notificações ativadas! Você será avisado quando seu pedido estiver pronto. 🔔");
              }
            }}
            disabled={pushLoading}
            className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-4 border border-primary/20 transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <BellRing className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-black text-gray-900">Ativar Notificações</p>
              <p className="text-[10px] font-bold text-gray-400">Saiba na hora quando seu pedido ficar pronto</p>
            </div>
          </button>
        )}

        {!isLoggedIn ? (
          <div className="space-y-6 rounded-[2rem] bg-white p-6 shadow-sm border border-gray-100 mt-12">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 text-center mb-6">
              Acesse com seu telefone
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Telefone (WhatsApp)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(formatPhoneNumber(e.target.value))}
                    placeholder="(00) 00000-0000"
                    type="tel"
                    disabled={isCheckingPhone}
                    className="h-14 rounded-2xl border-none bg-gray-50 pl-12 text-base md:text-sm shadow-inner focus-visible:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleLoginContinue}
              disabled={isCheckingPhone || !loginPhone}
              className="mt-8 h-16 w-full rounded-[2rem] bg-primary text-white shadow-xl shadow-primary/20 text-sm font-black uppercase tracking-widest hover:bg-primary/90"
            >
              {isCheckingPhone ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Ver meus pedidos"
              )}
            </Button>
          </div>
        ) : (
          <OrdersTabGroup 
            orders={orders} 
            companyId={companyId} 
            companySlug={companySlug} 
            paymentGatewayConfig={paymentGatewayConfig} 
            onRefreshRequest={() => {
              if (customerId) {
                loadOrders(customerId);
                router.refresh();
              }
            }}
          />
        )}
      </main>

      {/* Promotions Modal */}
      <PromotionsModal
        companySlug={companySlug}
        onSelectProduct={setSelectedProduct}
      />

      {/* Product Details Sheet */}
      <ProductDetailsSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Floating Cart Button */}
      <FloatingCartButton companyId={companyId} />

      {/* Bottom Navigation */}
      <BottomNav 
        companySlug={companySlug} 
      />
    </div>
  );
};

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
  Check,
  Phone
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { OrderStatusDto } from "@/app/_data-access/order/get-order-status";
import { getMyOrdersAction } from "@/app/_actions/order/get-my-orders";
import { cn, formatPhoneNumber } from "@/app/_lib/utils";
import { toast } from "sonner";
import { BottomNav } from "../../_components/bottom-nav";
import { PromotionsModal } from "../../_components/promotions-modal";
import { ProductDetailsSheet } from "../../_components/product-details-sheet";
import { FloatingCartButton } from "../../_components/floating-cart-button";
import { useUIStore } from "../../_store/use-ui-store";

interface MyOrdersClientProps {
  companyId: string;
  companySlug: string;
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
  
  const subtotal = order.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  
  const totalDiscount = order.items.reduce((acc, i) => {
    if (i.basePrice && i.basePrice > i.price) {
      return acc + (i.basePrice - i.price) * i.quantity;
    }
    return acc;
  }, 0);

  const subtotalWithDiscounts = subtotal + totalDiscount;

  return (
    <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white p-8 shadow-2xl shadow-gray-200/50 transition-all hover:shadow-gray-300/50">
      {/* Header: Order # and Icon */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tighter text-gray-900 uppercase">
            PEDIDO #{order.orderNumber}
          </h3>
          {order.customerName && (
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-1">
              {order.customerName}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
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
              <div key={idx} className="flex flex-col gap-3 py-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-sm font-black text-gray-900 leading-tight">
                      {item.name}
                    </span>
                    {item.notes && (
                      <span className="text-[10px] italic text-gray-400 leading-tight font-medium">
                        "{item.notes}"
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xs font-bold text-gray-500">
                      {formatPrice(item.price)}
                    </span>
                    {item.basePrice && item.basePrice > item.price && (
                      <span className="text-[9px] font-bold text-gray-400 line-through">
                        {formatPrice(item.basePrice)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  {/* Granular Item Status Badge */}
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "h-6 gap-1.5 px-2.5 text-[9px] font-black uppercase tracking-wider border transition-all shrink-0",
                      config.color
                    )}
                  >
                    <ItemIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>

                  <div className="flex items-center gap-2">
                    {/* Potential future: item.originalPrice here */}
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                      ({item.quantity}x) = 
                    </span>
                    <span className="text-xs font-black text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Footer */}
        <div className="mt-6 space-y-2 border-t border-gray-50 pt-4">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
            <span className="uppercase tracking-widest">Subtotal</span>
            <span>{formatPrice(subtotalWithDiscounts)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600">
              <span className="uppercase tracking-widest">Descontos</span>
              <span>-{formatPrice(totalDiscount)}</span>
            </div>
          )}
          {order.hasServiceTax && (
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
              <span className="uppercase tracking-widest">Taxa de Serviço (10%)</span>
              <span>
                {formatPrice(subtotal * 0.1)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Pago</span>
            <span className="text-lg font-black text-primary">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const MyOrdersClient = ({ companyId, companySlug }: MyOrdersClientProps) => {
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

  // Supabase Realtime - Sync order status in real-time
  useEffect(() => {
    if (!companyId || !customerId) return;

    const channel = supabase
      .channel(`my-orders-${customerId}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "Order",
        },
        (payload: any) => {
          console.log("🔄 My Orders Realtime:", payload.eventType, payload.new?.id);
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
  }, [companyId, customerId, router]);


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
        ) : orders.length === 0 ? (
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
            <Link href={`/${companySlug}`} className="mt-8">
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

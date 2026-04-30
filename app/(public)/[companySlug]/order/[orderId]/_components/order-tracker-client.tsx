"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Bike, 
  PackageCheck,
  MapPin,
  MessageCircle,
  Phone,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { supabase } from "@/app/_lib/supabase";

import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { Progress } from "@/app/_components/ui/progress";
// import { Separator } from "@/app/_components/ui/separator"; // Caso não exista

interface OrderTrackerClientProps {
  initialOrder: any;
  companyName: string;
  companyLogo: string | null;
  companySlug: string;
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Recebido",
    description: "Seu pedido chegou na nossa cozinha.",
    icon: Clock,
    color: "text-blue-500",
    progress: 20,
  },
  PREPARING: {
    label: "Preparando",
    description: "Nossos chefs estão cuidando do seu pedido.",
    icon: ChefHat,
    color: "text-orange-500",
    progress: 50,
  },
  READY: {
    label: "Pronto",
    description: "Pedido pronto! Logo sairá para entrega.",
    icon: PackageCheck,
    color: "text-green-500",
    progress: 80,
  },
  DELIVERED: {
    label: "Entregue",
    description: "Bom apetite! Esperamos que goste.",
    icon: CheckCircle2,
    color: "text-green-600",
    progress: 100,
  },
  PAID: {
    label: "Pago",
    description: "Pagamento confirmado. Obrigado!",
    icon: CheckCircle2,
    color: "text-green-600",
    progress: 100,
  },
  CANCELED: {
    label: "Cancelado",
    description: "Este pedido foi cancelado.",
    icon: Clock,
    color: "text-red-500",
    progress: 0,
  },
};

export const OrderTrackerClient = ({ 
  initialOrder,
  companyName,
  companyLogo,
  companySlug 
}: OrderTrackerClientProps) => {
  const [order, setOrder] = useState(initialOrder);
  const router = useRouter();

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
        (payload: any) => {
          console.log("🔄 Order Tracker Realtime Event:", payload.eventType, payload.new?.status);
          const newOrder = payload.new;
          setOrder((prev: any) => ({
            ...prev,
            ...newOrder,
          }));

          // Notificações baseadas no novo status
          if (newOrder.status === "PREPARING") {
            toast.info("Seu pedido está sendo preparado! 👨‍🍳", {
              description: "Nossos chefs já começaram a mágica.",
            });
          } else if (newOrder.status === "READY") {
            toast.success("Seu pedido está pronto! 🎉", {
              description: "Logo sairá para entrega ou retirada.",
            });
          } else if (newOrder.status === "DELIVERED" || newOrder.status === "PAID") {
            toast.success("Pedido finalizado com sucesso! ✅", {
              description: "Obrigado pela preferência e bom apetite!",
            });
          } else if (newOrder.status === "CANCELED") {
            toast.error("O pedido foi cancelado. ⚠️", {
              description: "Entre em contato com o suporte para mais informações.",
            });
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Order Tracker Realtime: Subscribed", { orderId: order.id });
        }
        if (status === "CHANNEL_ERROR") {
          console.error("❌ Order Tracker Realtime: Channel Error:", err);
        }
        if (status === "TIMED_OUT") {
          console.warn("⚠️ Order Tracker Realtime: Connection Timed Out");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  const currentStatus = (order.status as keyof typeof STATUS_CONFIG) || "PENDING";
  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.PENDING;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50 pb-20 font-sans shadow-2xl">
      {/* Header */}
      <div className="bg-white px-6 pb-6 pt-12 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Voltar ao cardápio
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              Acompanhe seu pedido
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              Pedido #{order.id.slice(-6).toUpperCase()}
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary border-none font-black px-3 py-1">
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Real-time Status Card */}
      <div className="px-6 -mt-4">
        <div className="rounded-[2.5rem] bg-white p-8 shadow-xl border border-gray-100">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`p-4 rounded-3xl bg-gray-50 ${config.color}`}>
              <config.icon size={48} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-gray-900">{config.label}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {config.description}
              </p>
            </div>
            <div className="w-full pt-4 space-y-2">
              <Progress value={config.progress} className="h-3 rounded-full bg-gray-100" />
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                <span>Recebido</span>
                <span>Preparando</span>
                <span>Pronto</span>
                <span>Entregue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="px-6 py-8 space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
          Detalhes do Pedido
        </h3>
        
        <div className="rounded-3xl bg-white p-6 shadow-md space-y-4">
          <div className="space-y-3">
            {order.orderItems?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-black">
                    {item.quantity}x
                  </span>
                  <span className="font-bold text-gray-700">{item.product.name}</span>
                </div>
                <span className="font-black text-gray-900">
                  {formatPrice(Number(item.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="h-px w-full bg-gray-100" />

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-bold text-gray-400">Total</span>
            <span className="text-xl font-black text-primary">
              {formatPrice(order.orderItems?.reduce((acc: number, item: any) => acc + (Number(item.price) * item.quantity), 0) || 0)}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="rounded-3xl bg-white p-6 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <MapPin className="text-gray-400" size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Mesa</p>
              <p className="text-sm font-black text-gray-900">
                {order.tableNumber ? `Mesa ${order.tableNumber}` : "Não informada"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Need Help? */}
      <div className="px-6 pb-12">
        <div className="rounded-3xl bg-gray-900 p-6 text-white shadow-xl flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-all">
          <div className="space-y-1">
            <h4 className="text-sm font-black tracking-tight">Algum problema?</h4>
            <p className="text-[11px] font-bold text-gray-400">Fale conosco agora no WhatsApp</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 group-hover:bg-white/20 transition-colors">
            <MessageCircle size={20} className="text-green-400 fill-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

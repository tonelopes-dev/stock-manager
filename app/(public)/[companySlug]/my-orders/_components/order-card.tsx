"use client";

import { useState } from "react";
import { OrderStatusDto } from "@/app/_data-access/order/get-order-status";
import { OrderStatus } from "@prisma/client";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  ShoppingBag,
  PackageCheck,
  Check,
  Zap,
  Loader2,
  Star,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/app/_lib/utils";
import { Button } from "@/app/_components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { generateInfinityPayCheckout } from "@/app/_actions/integration/generate-infinitypay-checkout";
import { rateOrderAction } from "@/app/_actions/order/rate-order";
import { toast } from "sonner";
import { useCartStore } from "../../_store/use-cart-store";
import { useRouter } from "next/navigation";
import { Textarea } from "@/app/_components/ui/textarea";

export const statusConfig: Record<
  OrderStatus,
  { label: string; icon: any; color: string; description: string; step: number; }
> = {
  PENDING: { label: "Pendente", icon: Clock, color: "text-muted-foreground", description: "Aguardando confirmação", step: 1 },
  PREPARING: { label: "Preparando", icon: ChefHat, color: "text-primary", description: "No fogo!", step: 2 },
  READY: { label: "Pronto", icon: PackageCheck, color: "text-green-500", description: "Saia para saborear!", step: 3 },
  DELIVERED: { label: "Entregue", icon: ShoppingBag, color: "text-primary", description: "Entregue na mesa!", step: 4 },
  PAID: { label: "Pago", icon: CheckCircle2, color: "text-green-600", description: "Finalizado.", step: 5 },
  SETTLED_LATER: { label: "A Pagar", icon: Clock, color: "text-blue-600", description: "Aguardando pagamento.", step: 5 },
  CANCELED: { label: "Cancelado", icon: Clock, color: "text-destructive", description: "Infelizmente cancelado.", step: 0 },
};

export const itemStatusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pendente", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Clock },
  PREPARING: { label: "Preparando", color: "bg-primary/10 text-primary border-primary/20", icon: ChefHat },
  READY: { label: "Pronto", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  DELIVERED: { label: "Entregue", color: "bg-primary/10 text-primary border-primary/20", icon: Check },
  PAID: { label: "Pago", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Check },
  SETTLED_LATER: { label: "A Pagar", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Check },
  CANCELED: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Clock },
};

export const OrderCard = ({
  order,
  companyId,
  companySlug,
  infinityPayEnabled = false,
  isActiveTab = false,
  isLastActive = false,
  activeOrdersTotal = 0,
  onPayComanda,
  isGeneratingCheckout = false,
}: {
  order: OrderStatusDto;
  companyId: string;
  companySlug: string;
  infinityPayEnabled?: boolean;
  isActiveTab?: boolean;
  isLastActive?: boolean;
  activeOrdersTotal?: number;
  onPayComanda?: () => void;
  isGeneratingCheckout?: boolean;
}) => {
  const router = useRouter();
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
  const isPendingPayment = order.status === "SETTLED_LATER";
  const isHistory = order.status === "PAID" || order.status === "CANCELED";
  const isPaid = order.status === "PAID";
  const isActive = ["PENDING", "PREPARING", "READY", "DELIVERED"].includes(order.status);

  // Mostra botão de pagamento individual se for A PAGAR
  const showIndividualPayButton = infinityPayEnabled && isPendingPayment && !isActiveTab;

  // Mostra botão de FECHAR COMANDA agrupado se for o último card da aba ATIVAS
  const showGroupedPayButton = infinityPayEnabled && isActiveTab && isLastActive;

  const addItemToCart = useCartStore(state => state.addItem);
  const setIsCartOpen = useCartStore(state => state.setIsCartOpen);

  const [ratingHover, setRatingHover] = useState(0);
  const [selectedRating, setSelectedRating] = useState(order.rating || 0);
  const [feedback, setFeedback] = useState(order.feedback || "");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const { execute: payNow, isExecuting: isExecutingIndividualCheckout } = useAction(generateInfinityPayCheckout, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        window.location.href = data.url; 
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Não foi possível gerar o link de pagamento.");
    }
  });

  const handlePayNow = () => {
    if (isPendingPayment && order.saleId) {
      payNow({ saleId: order.saleId, companyId });
    } else {
      toast.error("Erro interno: não foi possível identificar o pedido.");
    }
  };

  const { execute: submitRating, isExecuting: isSubmittingRating } = useAction(rateOrderAction, {
    onSuccess: () => {
      toast.success("Obrigado pela sua avaliação!");
      setShowFeedbackForm(false);
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Falha ao enviar avaliação.");
    }
  });

  const handleReorder = () => {
    let allAdded = true;
    order.items.forEach(item => {
      const added = addItemToCart({
        productId: item.productId,
        name: item.name,
        price: item.price,
        basePrice: item.basePrice,
        quantity: item.quantity,
        maxQuantity: 99, 
        notes: item.notes || undefined,
      });
      if (!added) allAdded = false;
    });

    if (allAdded) {
      toast.success("Itens adicionados ao carrinho!");
    } else {
      toast.warning("Alguns itens não puderam ser adicionados (limite de estoque).");
    }
    
    setIsCartOpen(true);
    router.push(`/${companySlug}`);
  };

  const handleRatingClick = (value: number) => {
    if (order.rating) return; 
    setSelectedRating(value);
    setShowFeedbackForm(true);
  };

  return (
    <Card className={cn(
      "overflow-hidden rounded-[2.5rem] border-none bg-white p-8 shadow-2xl transition-all relative",
      isPendingPayment ? "shadow-blue-200/50 hover:shadow-blue-300/50 ring-1 ring-blue-500/20" : "shadow-gray-200/50 hover:shadow-gray-300/50",
      isHistory && "opacity-95"
    )}>
      {/* Background Icon for History */}
      {isHistory && (
        <div className="absolute -right-8 -top-8 text-gray-50 opacity-50 pointer-events-none">
          <currentStatus.icon className="w-48 h-48" />
        </div>
      )}

      {/* Header: Order # and Icon */}
      <div className="mb-6 flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-black tracking-tighter text-gray-900 uppercase">
              PEDIDO #{order.orderNumber}
            </h3>
            {isPendingPayment && (
              <Badge variant="default" className="bg-amber-500 text-white animate-pulse shadow-sm border-none">
                <Zap className="w-3 h-3 mr-1" />
                Pendente
              </Badge>
            )}
            {isActiveTab && (
              <Badge variant="default" className="bg-amber-100 text-amber-600 shadow-sm border-none flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                Pendente
              </Badge>
            )}
            {order.rating && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                {order.rating}
              </Badge>
            )}
          </div>
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
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-gray-50",
            currentStatus.color
          )}
        >
          <currentStatus.icon className="h-6 w-6" />
        </div>
      </div>

      {/* Status Bar & Label */}
      {!isHistory && (
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
          {!isPendingPayment && (
            <div className="flex items-center gap-1.5 px-0.5">
              {[1, 2, 3, 4, 5].map((step) => {
                const isStepActive = currentStatus.step >= step;
                const isCurrent = currentStatus.step === step;
                return (
                  <div
                    key={step}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-all duration-700",
                      isStepActive 
                        ? isCurrent ? "bg-primary animate-pulse" : "bg-primary"
                        : "bg-gray-100"
                    )}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Item List */}
      <div className="mt-6 space-y-4 border-t border-gray-50 pt-6 relative z-10">
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

        {/* Total Footer - Omitido se for a view combinada (showGroupedPayButton) e a gente quiser mostrar o total agrupado ao invés do individual. Mas vamos manter o subtotal individual e logo abaixo colocar o agrupado */}
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
          
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {!isActiveTab ? (isPendingPayment ? "Total em Aberto" : "Total") : "Total deste Pedido"}
            </span>
            <span className="text-lg font-black text-primary">
              {formatPrice(order.totalAmount)}
            </span>
          </div>

          {/* Checkout Button Individual (A Pagar) */}
          {showIndividualPayButton && (
            <div className="pt-4">
              <Button 
                onClick={handlePayNow}
                disabled={isExecutingIndividualCheckout}
                className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20"
              >
                {isExecutingIndividualCheckout ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Pagar Agora
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Checkout Button Grouped (ATIVAS) */}
          {showGroupedPayButton && (
            <div className="pt-6 mt-4 border-t-2 border-dashed border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-gray-500">Total da Comanda</span>
                <span className="text-xl font-black text-gray-900">
                  {formatPrice(activeOrdersTotal || 0)}
                </span>
              </div>
              <Button 
                onClick={onPayComanda}
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
          )}

          {/* History Actions: NPS & Reorder */}
          {isHistory && (
            <div className="pt-6 space-y-4 border-t border-gray-50">
              <Button 
                onClick={handleReorder}
                variant="outline"
                className="w-full h-12 rounded-2xl border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-widest hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Repetir Pedido
              </Button>

              {isPaid && !order.rating && (
                <div className="flex flex-col items-center pt-2 gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Como foi sua experiência?
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleRatingClick(value)}
                        onMouseEnter={() => setRatingHover(value)}
                        onMouseLeave={() => setRatingHover(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "w-8 h-8 transition-colors",
                            (ratingHover || selectedRating) >= value
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-100 text-gray-200"
                          )}
                        />
                      </button>
                    ))}
                  </div>

                  {showFeedbackForm && (
                    <div className="w-full space-y-3 animate-in fade-in slide-in-from-top-2">
                      <Textarea 
                        placeholder="Deixe um comentário (opcional)..." 
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="resize-none text-sm rounded-xl"
                      />
                      <Button 
                        onClick={() => submitRating({ orderId: order.id, companyId, rating: selectedRating, feedback })}
                        disabled={isSubmittingRating}
                        className="w-full rounded-xl bg-gray-900 text-white hover:bg-gray-800 font-bold"
                      >
                        {isSubmittingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Avaliação"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

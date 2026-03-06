"use client";

import { PendingOrderDto } from "@/app/_data-access/order/get-pending-orders";
import { useState } from "react";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  DollarSign,
  Smartphone,
  Wallet,
} from "lucide-react";
import { convertOrderToSaleAction } from "@/app/_actions/order/convert-to-sale";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingOrdersBannerProps {
  orders: PendingOrderDto[];
  companyId: string;
}

const paymentMethodLabels: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  PIX: { label: "PIX", icon: <Smartphone className="h-3.5 w-3.5" /> },
  CASH: { label: "Dinheiro", icon: <DollarSign className="h-3.5 w-3.5" /> },
  CREDIT_CARD: {
    label: "Crédito",
    icon: <CreditCard className="h-3.5 w-3.5" />,
  },
  DEBIT_CARD: { label: "Débito", icon: <CreditCard className="h-3.5 w-3.5" /> },
  OTHER: { label: "Outro", icon: <Wallet className="h-3.5 w-3.5" /> },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: "Pendente",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  PREPARING: {
    label: "Preparando",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  READY: {
    label: "Pronto",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

export const PendingOrdersBanner = ({
  orders,
  companyId,
}: PendingOrdersBannerProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>(
    {},
  );

  if (orders.length === 0) return null;

  const handleConvert = async (orderId: string) => {
    const method = paymentMethods[orderId];
    if (!method) {
      toast.error("Selecione um método de pagamento.");
      return;
    }
    setLoadingOrderId(orderId);
    try {
      const result = await convertOrderToSaleAction({
        orderId,
        companyId,
        paymentMethod: method as any,
      });
      if (result?.data?.success) {
        toast.success("Pedido convertido em venda com sucesso!");
      } else {
        toast.error(result?.serverError || "Erro ao converter pedido.");
      }
    } catch (err) {
      toast.error("Erro inesperado.");
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-violet-50/40 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-white/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Clock className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-900">
              Pedidos Aguardando Pagamento
            </h3>
            <p className="text-xs text-slate-500">
              {orders.length} {orders.length === 1 ? "pedido" : "pedidos"} do
              cardápio digital
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white shadow-sm">
            {orders.length}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-3 border-t border-blue-100/60 px-6 pb-5 pt-4">
          {orders.map((order) => {
            const status = statusLabels[order.status] || statusLabels.PENDING;
            return (
              <div
                key={order.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black italic text-slate-900">
                      #{order.orderNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className={`rounded-lg text-[10px] font-bold ${status.color}`}
                    >
                      {status.label}
                    </Badge>
                    {order.tableNumber && (
                      <Badge className="rounded-lg bg-slate-900 text-[10px] font-bold text-white">
                        Mesa {order.tableNumber}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      {order.orderItems
                        .map(
                          (item) =>
                            `${Number(item.quantity)}x ${item.product.name}`,
                        )
                        .join(", ")}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      {formatDistanceToNow(new Date(order.createdAt), {
                        locale: ptBR,
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-lg font-black text-blue-600">
                  {Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(order.totalAmount))}
                </div>

                <Select
                  value={paymentMethods[order.id] || ""}
                  onValueChange={(val) =>
                    setPaymentMethods((prev) => ({ ...prev, [order.id]: val }))
                  }
                >
                  <SelectTrigger className="h-10 w-[130px] rounded-xl border-slate-200 text-xs font-bold">
                    <SelectValue placeholder="Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethodLabels).map(
                      ([key, { label, icon }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {icon}
                            {label}
                          </div>
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  disabled={
                    !paymentMethods[order.id] || loadingOrderId === order.id
                  }
                  onClick={() => handleConvert(order.id)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loadingOrderId === order.id ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                  Registrar Venda
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

"use client";

import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { ComandaDto } from "@/app/_data-access/order/get-active-comandas";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, ShoppingBag, User } from "lucide-react";
import { formatCurrency } from "@/app/_helpers/currency";
import { cn } from "@/app/_lib/utils";
import { useEffect, useState } from "react";

interface ComandaCardProps {
  comanda: ComandaDto;
  onClick?: (comanda: ComandaDto) => void;
}

export const ComandaCard = ({ comanda, onClick }: ComandaCardProps) => {
  const [now, setNow] = useState(new Date());

  // Update time every minute to keep "elapsed time" fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hoursElapsed = differenceInHours(now, comanda.lastOrderAt);
  const isForgotten = hoursElapsed >= 4;

  return (
    <Card
      onClick={() => onClick?.(comanda)}
      className={cn(
        "group relative cursor-pointer overflow-hidden border-slate-100 bg-white transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
        isForgotten &&
          "border-amber-400 shadow-amber-50 ring-1 ring-amber-400/20",
      )}
    >
      {isForgotten && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
          Atenção: &gt;4h
        </div>
      )}

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                <User size={16} />
              </div>
              <h3 className="line-clamp-1 text-sm font-black uppercase italic tracking-tighter text-slate-900">
                {comanda.customerName}
              </h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400">
              {comanda.customerPhone || "Sem telefone"}
            </p>
          </div>

          <Badge
            variant="outline"
            className="border-slate-100 bg-slate-50/50 text-[10px] font-black text-slate-500"
          >
            {comanda.orderCount}{" "}
            {comanda.orderCount === 1 ? "Pedido" : "Pedidos"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] font-black uppercase italic tracking-tighter text-slate-400">
              <Clock
                size={12}
                className={cn(
                  isForgotten ? "text-amber-500" : "text-slate-400",
                )}
              />
              Aberta há
            </span>
            <p
              className={cn(
                "text-xs font-bold text-slate-600",
                isForgotten && "font-black text-amber-600",
              )}
            >
              {formatDistanceToNow(comanda.firstOrderAt, { locale: ptBR })}
            </p>
          </div>

          <div className="space-y-1 text-right">
            <span className="flex items-center justify-end gap-1 text-[10px] font-black uppercase italic tracking-tighter text-slate-400">
              <ShoppingBag size={12} />
              Consumo
            </span>
            <p className="text-lg font-black tracking-tighter text-primary">
              {formatCurrency(comanda.totalAmount)}
            </p>
          </div>
        </div>

        {/* Peek at items */}
        <div className="mt-4 border-t border-slate-50 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {comanda.items.slice(0, 3).map((item, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="border-none bg-slate-50 text-[9px] font-medium text-slate-500"
              >
                {item.quantity}x {item.name}
              </Badge>
            ))}
            {comanda.items.length > 3 && (
              <span className="text-[9px] font-bold text-slate-300">
                +{comanda.items.length - 3} mais
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

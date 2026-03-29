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

  const hoursElapsed = differenceInHours(now, comanda.firstOrderAt);
  const isForgotten = hoursElapsed >= 4;

  return (
    <Card
      onClick={() => onClick?.(comanda)}
      className={cn(
        "group relative cursor-pointer overflow-hidden border-border bg-background transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
        isForgotten &&
          "border-orange-500 shadow-amber-50 ring-1 ring-orange-500/20",
      )}
    >
      {comanda.source === "IFOOD" && (
        <div className="absolute left-0 top-0 rounded-br-xl bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg animate-in fade-in slide-in-from-left-2">
          iFood
        </div>
      )}

      {isForgotten && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-orange-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-background shadow-sm">
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
              <h3 className="line-clamp-1 text-sm font-black uppercase italic tracking-tighter text-foreground">
                {comanda.ifoodDisplayId ? `#${comanda.ifoodDisplayId} - ` : ""}{comanda.customerName}
              </h3>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground">
              {comanda.customerPhone || "Sem telefone"}
            </p>
          </div>

          <Badge
            variant="outline"
            className="border-border bg-muted/50 text-[10px] font-black text-muted-foreground"
          >
            {comanda.orderCount}{" "}
            {comanda.orderCount === 1 ? "Pedido" : "Pedidos"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
              <Clock
                size={12}
                className={cn(
                  isForgotten ? "text-orange-500" : "text-muted-foreground",
                )}
              />
              Aberta há
            </span>
            <p
              className={cn(
                "text-xs font-bold text-muted-foreground",
                isForgotten && "font-black text-orange-500",
              )}
            >
              {formatDistanceToNow(comanda.firstOrderAt, { locale: ptBR })}
            </p>
          </div>

          <div className="space-y-1 text-right">
            <span className="flex items-center justify-end gap-1 text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
              <ShoppingBag size={12} />
              Consumo
            </span>
            <p className="text-lg font-black tracking-tighter text-primary">
              {formatCurrency(comanda.totalAmount)}
            </p>
          </div>
        </div>

        {/* iFood Delivery Info */}
        {comanda.source === "IFOOD" && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 p-3 animate-in zoom-in-95">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 rounded-full bg-red-100 p-1 text-red-600">
                <Clock size={10} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-red-700">Entrega iFood</p>
                <p className="line-clamp-2 text-[10px] font-bold leading-tight text-red-900/70">
                  {comanda.deliveryAddress ? JSON.parse(comanda.deliveryAddress).formattedAddress : "Endereço não informado"}
                </p>
                {comanda.deliveryFee && (
                  <p className="text-[9px] font-black text-red-600">
                    Taxa: {formatCurrency(comanda.deliveryFee)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Peek at items */}
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex flex-wrap gap-1.5">
            {comanda.items.slice(0, 3).map((item, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="border-none bg-muted text-[9px] font-medium text-muted-foreground"
              >
                {item.quantity}x {item.name}
              </Badge>
            ))}
            {comanda.items.length > 3 && (
              <span className="text-[9px] font-bold text-muted-foreground">
                +{comanda.items.length - 3} mais
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

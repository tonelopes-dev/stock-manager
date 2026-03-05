"use client";

import { ShoppingBag, Calendar, ArrowUpRight } from "lucide-react";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/app/_lib/utils";

interface SalesTimelineProps {
  sales: {
    totalAmount: number;
    date: Date;
    products: { name: string; quantity: number }[];
  }[];
}

export const SalesTimeline = ({ sales }: SalesTimelineProps) => {
  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-400">
        <ShoppingBag className="mb-2 h-10 w-10 opacity-20" />
        <p className="text-sm font-medium">Nenhuma venda registrada.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 before:absolute before:bottom-2 before:left-2.5 before:top-2 before:w-px before:bg-slate-100">
      {sales.map((sale, index) => (
        <div key={index} className="group relative pl-8">
          <div className="absolute left-0 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-100 transition-all group-hover:scale-110 group-hover:bg-primary">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-400 group-hover:bg-white" />
          </div>

          <div className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition-colors group-hover:border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black uppercase italic tracking-tighter text-slate-800">
                Venda Realizada
              </span>
              <span className="text-xs font-black text-primary">
                {formatCurrency(Number(sale.totalAmount))}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {sale.products.map((product, pIndex) => (
                <span
                  key={pIndex}
                  className="text-[10px] font-bold text-slate-500"
                >
                  {product.quantity}x {product.name}
                  {pIndex < sale.products.length - 1 && ","}
                </span>
              ))}
            </div>

            <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
              <Calendar className="h-3 w-3" />
              {format(new Date(sale.date), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

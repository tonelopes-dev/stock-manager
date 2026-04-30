"use client";

import { ShoppingBag, Calendar, ArrowUpRight } from "lucide-react";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/app/_lib/utils";

interface SalesTimelineProps {
  sales: {
    id: string;
    totalAmount: number;
    date: Date;
    status: string;
    products: { name: string; quantity: number }[];
  }[];
}

export const SalesTimeline = ({ sales }: SalesTimelineProps) => {
  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <ShoppingBag className="mb-2 h-10 w-10 opacity-20" />
        <p className="text-sm font-medium">Nenhuma venda registrada.</p>
      </div>
    );
  }

  // Agrupar por ID de transação e timestamp exato para evitar fragmentação de itens do mesmo pedido
  const groupedTransactions = sales.reduce((acc, curr) => {
    const eventKey = `${curr.id}-${new Date(curr.date).getTime()}`;
    
    if (!acc[eventKey]) {
      acc[eventKey] = {
        ...curr,
        products: [...curr.products]
      };
    } else {
      acc[eventKey].totalAmount += curr.totalAmount;
      curr.products.forEach((newP) => {
        const existingP = acc[eventKey].products.find((p: { name: string }) => p.name === newP.name);
        if (existingP) {
          existingP.quantity += newP.quantity;
        } else {
          acc[eventKey].products.push(newP);
        }
      });
    }
    return acc;
  }, {} as Record<string, any>);

  const displaySales = Object.values(groupedTransactions)
    .map(s => ({
      ...s,
      isOrder: s.status !== "PAID"
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative space-y-6 before:absolute before:bottom-2 before:left-2.5 before:top-2 before:w-px before:bg-muted">
      {displaySales.map((sale, index) => (
        <div key={index} className="group relative pl-8">
          <div className="absolute left-0 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-muted transition-all group-hover:scale-110 group-hover:bg-primary">
            <div className="h-1.5 w-1.5 rounded-full bg-muted group-hover:bg-background" />
          </div>

          <div className={`flex flex-col gap-1 rounded-lg border p-3 shadow-sm transition-colors ${sale.isOrder ? 'border-primary/40 bg-primary/5 group-hover:border-primary/60' : 'border-border bg-background group-hover:border-primary/20'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-black uppercase italic tracking-tighter ${sale.isOrder ? 'text-primary' : 'text-foreground'}`}>
                {sale.isOrder ? 'Comanda Aberta' : 'Venda Realizada'}
              </span>
              <span className={`text-xs font-black ${sale.isOrder ? 'text-primary/80' : 'text-primary'}`}>
                {formatCurrency(Number(sale.totalAmount))}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {sale.products.map((product: { name: string; quantity: number }, pIndex: number) => (
                <span
                  key={pIndex}
                  className="text-[10px] font-bold text-muted-foreground"
                >
                  {product.quantity}x {product.name}
                  {pIndex < sale.products.length - 1 && ","}
                </span>
              ))}
            </div>

            <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
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

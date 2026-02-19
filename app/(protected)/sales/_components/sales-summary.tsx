"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/app/_components/ui/popover";
import { LucideIcon, DollarSignIcon, TrendingUpIcon, ShoppingBagIcon, ArrowUpRightIcon, ArrowDownRightIcon, ShoppingBasketIcon } from "lucide-react";
import { cn } from "@/app/_lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  trend: number;
  icon: LucideIcon;
  description: string;
  info?: string;
}

const SummaryCard = ({ title, value, trend, icon: Icon, description, info }: SummaryCardProps) => {
  const iconContent = (
    <div className={cn(
        "p-2 bg-slate-50 rounded-xl transition-all text-slate-400",
        info ? "hover:bg-slate-100 hover:text-primary cursor-pointer shadow-sm" : ""
    )}>
        <Icon size={16} />
    </div>
  );

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden group transition-all hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50/30">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</CardTitle>
        
        {info ? (
            <Popover>
                <PopoverTrigger asChild>
                    <button className="outline-none border-none focus:ring-2 focus:ring-primary/20 rounded-xl transition-all">
                        {iconContent}
                    </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="max-w-[240px] text-xs font-medium leading-relaxed bg-slate-900 text-white border-slate-800 shadow-xl">
                    {info}
                </PopoverContent>
            </Popover>
        ) : iconContent}
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-black text-slate-900">{value}</div>
          <div className={`flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-full ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              {trend >= 0 ? <ArrowUpRightIcon size={10} className="mr-0.5" /> : <ArrowDownRightIcon size={10} className="mr-0.5" />}
              {Math.abs(trend)}%
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 font-medium">{description}</p>
      </CardContent>
    </Card>
  );
};

interface SalesSummaryProps {
  totalRevenue: { value: number; trend: number };
  totalProfit: { value: number; trend: number };
  averageTicket: { value: number; trend: number };
  totalSales: { value: number; trend: number };
}

export const SalesSummary = ({ totalRevenue, totalProfit, averageTicket, totalSales }: SalesSummaryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <SummaryCard
        title="Faturamento"
        value={Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRevenue.value)}
        trend={totalRevenue.trend}
        icon={DollarSignIcon}
        description="Total em vendas no período"
        info="Soma de todas as suas vendas. É o valor bruto que entrou no caixa antes de qualquer desconto ou custo."
      />
      <SummaryCard
        title="Vendas"
        value={totalSales.value.toString()}
        trend={totalSales.trend}
        icon={ShoppingBasketIcon}
        description="Quantidade de transações"
        info="Número total de pedidos realizados no período. Cada pedido pode conter vários produtos diferentes."
      />
      <SummaryCard
        title="Ticket Médio"
        value={Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(averageTicket.value)}
        trend={averageTicket.trend}
        icon={ShoppingBagIcon}
        description="Valor médio por transação"
        info="O valor médio que cada cliente gasta por compra. É calculado dividindo o Faturamento Total pelo Número de Vendas."
      />
      <SummaryCard
        title="Lucro Bruto"
        value={Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalProfit.value)}
        trend={totalProfit.trend}
        icon={TrendingUpIcon}
        description="Faturamento menos custo base"
        info="Quanto sobrou no seu bolso após pagar o custo dos produtos vendidos. (Faturamento - Custo de Aquisição)."
      />
    </div>
  );
};

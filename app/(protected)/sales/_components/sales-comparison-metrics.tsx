"use client";

import { TrendingUpIcon, TrendingDownIcon, DollarSignIcon, ShoppingCartIcon, TagIcon } from "lucide-react";
import { formatCurrency } from "@/app/_lib/utils";
import { cn } from "@/app/_lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
  description: string;
  info: string;
}

function MetricCard({ title, value, trend, icon: Icon, description, info }: MetricCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  const iconContent = (
    <div className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-primary transition-all cursor-pointer">
      <Icon size={20} />
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group">
      <div className="flex items-start justify-between mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className="outline-none focus:ring-2 focus:ring-primary/20 rounded-xl transition-all">
              {iconContent}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="max-w-[240px] text-xs font-medium leading-relaxed bg-slate-900 text-white border-slate-800 shadow-xl">
            {info}
          </PopoverContent>
        </Popover>
        
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold",
            isPositive ? "bg-emerald-50 text-emerald-600" : 
            isNegative ? "bg-rose-50 text-rose-600" : 
            "bg-slate-50 text-slate-500"
          )}>
            {isPositive ? <TrendingUpIcon size={12} /> : isNegative ? <TrendingDownIcon size={12} /> : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        <p className="text-[10px] font-medium text-slate-400 mt-2">{description}</p>
      </div>
    </div>
  );
}

interface SalesComparisonMetricsProps {
  comparison: {
    periodA: { name: string; revenue: number; salesCount: number; avgTicket: number };
    periodB: { name: string; revenue: number; salesCount: number; avgTicket: number };
  };
}

export function SalesComparisonMetrics({ comparison }: SalesComparisonMetricsProps) {
  const { periodA, periodB } = comparison;

  const calculateTrend = (curr: number, prev: number) => {
    if (prev <= 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const revenueTrend = calculateTrend(periodA.revenue, periodB.revenue);
  const salesTrend = calculateTrend(periodA.salesCount, periodB.salesCount);
  const ticketTrend = calculateTrend(periodA.avgTicket, periodB.avgTicket);

  // Simple Insight Logic
  let insight = "";
  if (revenueTrend > 0) {
    insight = `${periodA.name} superou ${periodB.name} em ${formatCurrency(periodA.revenue - periodB.revenue)}.`;
    if (salesTrend > revenueTrend) {
      insight += " O crescimento foi impulsionado principalmente pelo volume de vendas.";
    } else if (ticketTrend > 0) {
      insight += " O aumento no ticket médio foi o principal fator para este resultado.";
    }
  } else if (revenueTrend < 0) {
    insight = `${periodA.name} teve uma queda de ${Math.abs(revenueTrend)}% em relação a ${periodB.name}.`;
    if (salesTrend < revenueTrend) {
      insight += " A redução no número de pedidos impactou negativamente o faturamento.";
    } else {
      insight += " A queda no valor médio das vendas sugere uma mudança no perfil de consumo.";
    }
  } else {
    insight = "O desempenho manteve-se estável entre os períodos comparados.";
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Faturamento"
          value={formatCurrency(periodA.revenue)}
          trend={revenueTrend}
          icon={DollarSignIcon}
          description={`vs. ${periodB.name}`}
          info="Total de receita bruta gerada pelas vendas no Período A, sem dedução de custos ou impostos."
        />
        <MetricCard 
          title="Crescimento %"
          value={`${revenueTrend > 0 ? "+" : ""}${revenueTrend}%`}
          icon={TrendingUpIcon}
          description="Variação da receita total"
          info="Variação percentual do faturamento do Período A em relação ao Período B (benchmark)."
        />
        <MetricCard 
          title="Vendas"
          value={periodA.salesCount}
          trend={salesTrend}
          icon={ShoppingCartIcon}
          description={`Total de pedidos em ${periodA.name}`}
          info="Número total de pedidos concluídos durante o Período A."
        />
        <MetricCard 
          title="Ticket Médio"
          value={formatCurrency(periodA.avgTicket)}
          trend={ticketTrend}
          icon={TagIcon}
          description="Valor médio por venda"
          info="Valor médio faturado por pedido no Período A (Receita Total / Quantidade de Vendas)."
        />
      </div>

      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <p className="text-xs font-medium text-slate-600 italic">
          <span className="font-black text-slate-900 not-italic mr-1">INSIGHT:</span>
          {insight}
        </p>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { DollarSignIcon, TrendingUpIcon, ShoppingBagIcon, ArrowUpRightIcon, ArrowDownRightIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string;
  trend: number;
  icon: any;
  description: string;
}

const SummaryCard = ({ title, value, trend, icon: Icon, description }: SummaryCardProps) => (
  <Card className="border-slate-200 shadow-sm overflow-hidden group transition-all hover:border-primary/20">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50/30">
      <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</CardTitle>
      <div className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400 group-hover:text-primary transition-colors">
        <Icon size={16} />
      </div>
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

interface SalesSummaryProps {
  totalRevenue: { value: number; trend: number };
  totalProfit: { value: number; trend: number };
  averageTicket: { value: number; trend: number };
}

export const SalesSummary = ({ totalRevenue, totalProfit, averageTicket }: SalesSummaryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SummaryCard
        title="Faturamento"
        value={Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRevenue.value)}
        trend={totalRevenue.trend}
        icon={DollarSignIcon}
        description="Total em vendas no período"
      />
      <SummaryCard
        title="Lucro Bruto"
        value={Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalProfit.value)}
        trend={totalProfit.trend}
        icon={TrendingUpIcon}
        description="Faturamento menos custo base"
      />
      <SummaryCard
        title="Ticket Médio"
        value={Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(averageTicket.value)}
        trend={averageTicket.trend}
        icon={ShoppingBagIcon}
        description="Valor médio por transação"
      />
    </div>
  );
};

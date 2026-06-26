import {
  KpiCard,
  KpiCardSkeleton,
  formatCurrencyBR,
  formatPercent,
} from "./kpi-card";
import { AnalyticsMetric } from "@/app/_data-access/dashboard/get-dashboard-analytics";
import Link from "next/link";
import { Clock, InfoIcon, Wallet } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";

interface KpiGridProps {
  revenue: AnalyticsMetric;
  profit: AnalyticsMetric;
  cogs: AnalyticsMetric;
  margin: AnalyticsMetric;
  tips: AnalyticsMetric;
  accountsReceivable: number;
}

export const KpiGrid = ({ revenue, profit, cogs, margin, tips, accountsReceivable }: KpiGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        title="Receita"
        value={formatCurrencyBR(revenue.value)}
        trend={revenue.trend}
        description="Soma total de todas as vendas brutas realizadas no período selecionado."
      />
      <KpiCard
        title="Lucro"
        value={formatCurrencyBR(profit.value)}
        trend={profit.trend}
        description="Valor que sobra após subtrair o custo das mercadorias (COGS) da receita total."
      />
      <KpiCard
        title="COGS"
        value={formatCurrencyBR(cogs.value)}
        subtitle="Custo das mercadorias vendidas"
        trend={cogs.trend}
        description="Custo total de aquisição ou produção dos itens que foram vendidos no período."
      />
      <KpiCard
        title="Margem %"
        value={formatPercent(margin.value)}
        trend={margin.trend}
        description="Rentabilidade relativa (Lucro / Receita). Indica quantos centavos de lucro são gerados para cada R$ 1,00 vendido."
      />
      <KpiCard
        title="Gorjetas"
        value={formatCurrencyBR(tips.value)}
        trend={tips.trend}
        description="Total acumulado de gorjetas e taxas de serviço para repasse à equipe."
      />

      {/* 6. CONTAS A RECEBER (FIADO / VIP) */}
      <Link href="/sales" className="block outline-none">
        <div className="group relative overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50/40 via-background to-background p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md hover:shadow-orange-500/10">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-orange-500" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-orange-700">
                A Receber
              </p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button className="cursor-pointer border-none text-muted-foreground outline-none transition-colors hover:text-orange-600">
                  <InfoIcon size={14} strokeWidth={2.5} />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                className="max-w-[240px] border-foreground bg-foreground text-[11px] font-medium leading-relaxed text-background shadow-xl"
              >
                Valores de vendas lançadas como 'Pagar Depois (VIP / Fiado)'. Clique para gerenciar e dar baixa.
              </PopoverContent>
            </Popover>
          </div>

          <p className="mb-1 text-2xl font-black leading-none tracking-tight text-foreground">
            {formatCurrencyBR(accountsReceivable)}
          </p>

          <p className="mt-1 text-xs font-medium text-orange-600/80 group-hover:text-orange-600 group-hover:underline">
            Ver títulos em aberto ↗
          </p>

          <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 group-hover:w-full" />
        </div>
      </Link>
    </div>
  );
};

export const KpiGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <KpiCardSkeleton key={i} />
    ))}
  </div>
);

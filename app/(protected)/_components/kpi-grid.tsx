import {
  KpiCard,
  KpiCardSkeleton,
  formatCurrencyBR,
  formatPercent,
} from "./kpi-card";
import { AnalyticsMetric } from "@/app/_data-access/dashboard/get-dashboard-analytics";

interface KpiGridProps {
  revenue: AnalyticsMetric;
  profit: AnalyticsMetric;
  cogs: AnalyticsMetric;
  margin: AnalyticsMetric;
}

export const KpiGrid = ({ revenue, profit, cogs, margin }: KpiGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
};

export const KpiGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[1, 2, 3, 4].map((i) => (
      <KpiCardSkeleton key={i} />
    ))}
  </div>
);

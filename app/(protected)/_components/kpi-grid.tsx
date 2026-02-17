import { KpiCard, KpiCardSkeleton, formatCurrencyBR, formatPercent } from "./kpi-card";
import { AnalyticsMetric } from "@/app/_data-access/dashboard/get-dashboard-analytics";

interface KpiGridProps {
  revenue: AnalyticsMetric;
  profit: AnalyticsMetric;
  cogs: AnalyticsMetric;
  margin: AnalyticsMetric;
}

export const KpiGrid = ({ revenue, profit, cogs, margin }: KpiGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Receita"
        value={formatCurrencyBR(revenue.value)}
        trend={revenue.trend}
      />
      <KpiCard
        title="Lucro"
        value={formatCurrencyBR(profit.value)}
        trend={profit.trend}
      />
      <KpiCard
        title="COGS"
        value={formatCurrencyBR(cogs.value)}
        subtitle="Custo das mercadorias vendidas"
        trend={cogs.trend}
      />
      <KpiCard
        title="Margem %"
        value={formatPercent(margin.value)}
        trend={margin.trend}
      />
    </div>
  );
};

export const KpiGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <KpiCardSkeleton key={i} />
    ))}
  </div>
);

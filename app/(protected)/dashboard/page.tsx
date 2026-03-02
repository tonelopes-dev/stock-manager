import {
  getDashboardAnalytics,
  DashboardRange,
} from "@/app/_data-access/dashboard/get-dashboard-analytics";
import { DateRangePicker } from "@/app/(protected)/_components/date-range-picker";
import { KpiGrid } from "../_components/kpi-grid";
import { Suspense } from "react";
import { SalesChart } from "../_components/sales-chart";
import { ProductRankingCard } from "../_components/product-ranking-card";
import LowStockAlerts, {
  LowStockAlertsSkeleton,
} from "../_components/low-stock-alerts";
import { GoalsSummary } from "./_components/goals-summary";

export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: { from?: string; to?: string; range?: string };
}

const Home = async ({ searchParams }: HomeProps) => {
  const range =
    (searchParams.range as DashboardRange) ||
    (searchParams.from && searchParams.to ? "custom" : "30d");

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col space-y-8 p-8">
      {/* 1. DATE RANGE PICKER */}
      <DateRangePicker />

      {/* DATA CONTENT */}
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <DashboardContent
          range={range}
          from={searchParams.from}
          to={searchParams.to}
        />
      </Suspense>

      {/* EXTRA: LOW STOCK ALERTS */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Suspense fallback={<LowStockAlertsSkeleton />}>
          <LowStockAlerts />
        </Suspense>
      </div>
    </div>
  );
};

const DashboardContent = async ({
  range,
  from,
  to,
}: {
  range: DashboardRange;
  from?: string;
  to?: string;
}) => {
  const data = await getDashboardAnalytics(range, from, to);

  return (
    <div className="space-y-8">
      {/* 2. KPI GRID */}
      <KpiGrid
        revenue={data.revenue}
        profit={data.profit}
        cogs={data.cogs}
        margin={data.margin}
      />

      <Suspense
        fallback={
          <div className="h-44 animate-pulse rounded-xl border border-slate-100 bg-slate-50" />
        }
      >
        <GoalsSummary />
      </Suspense>

      {/* 3. SALES CHART */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900">
              Análise de Vendas
            </h3>
            <p className="text-xs font-medium text-slate-500">
              Receita vs. Lucro por dia — COGS visível no tooltip.
            </p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <SalesChart data={data.revenueTimeSeries} />
        </div>
      </div>

      {/* 4. RANKINGS — two columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProductRankingCard
          title="Top Lucratividade"
          products={data.topProfitable}
          highlightType="profit"
        />
        <ProductRankingCard
          title="Margem Crítica"
          products={data.worstMargin}
          highlightType="margin"
        />
      </div>
    </div>
  );
};

const DashboardLoadingSkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
    </div>
    <div className="h-[440px] w-full animate-pulse rounded-xl bg-slate-50" />
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="h-64 animate-pulse rounded-xl bg-slate-50" />
      <div className="h-64 animate-pulse rounded-xl bg-slate-50" />
    </div>
  </div>
);

export default Home;

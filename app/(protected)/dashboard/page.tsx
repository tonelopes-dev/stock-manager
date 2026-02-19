import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { KpiGrid, KpiGridSkeleton } from "@/app/(protected)/_components/kpi-grid";
import { Suspense } from "react";
import { SalesChart } from "@/app/(protected)/_components/sales-chart";
import { ProductRankingCard, ProductRankingCardSkeleton } from "@/app/(protected)/_components/product-ranking-card";
import LowStockAlerts, { 
  LowStockAlertsSkeleton 
} from "@/app/(protected)/_components/low-stock-alerts";
import { getDashboardAnalytics, DashboardRange } from "@/app/_data-access/dashboard/get-dashboard-analytics";
import { DateRangePicker } from "@/app/(protected)/_components/date-range-picker";

export const dynamic = "force-dynamic";

interface HomeProps {
    searchParams: { from?: string; to?: string; range?: string };
}

const Home = async ({ searchParams }: HomeProps) => {
  const range = (searchParams.range as DashboardRange) || 
                ((searchParams.from && searchParams.to) ? "custom" : "30d");

  return (
    <div className="flex flex-col space-y-8 p-8 max-w-[1600px] mx-auto w-full">
      {/* HEADER */}
      <Header>
        <HeaderLeft className="flex items-center gap-6">
          <div className="space-y-1">
            <HeaderSubtitle>Visão geral dos dados</HeaderSubtitle>
            <HeaderTitle>Dashboard</HeaderTitle>
          </div>
        </HeaderLeft>
      </Header>

      {/* 1. DATE RANGE PICKER */}
      <DateRangePicker />

      {/* 2–4. DATA CONTENT */}
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <DashboardContent range={range} from={searchParams.from} to={searchParams.to} />
      </Suspense>

      {/* EXTRA: LOW STOCK ALERTS */}
      <Suspense fallback={<LowStockAlertsSkeleton />}>
        <LowStockAlerts />
      </Suspense>
    </div>
  );
};

const DashboardContent = async ({ range, from, to }: { range: DashboardRange; from?: string; to?: string }) => {
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

            {/* 3. SALES CHART */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-black text-slate-900 italic tracking-tighter uppercase">Análise de Vendas</h3>
                    <p className="text-xs font-medium text-slate-500">Receita vs. Lucro por dia — COGS visível no tooltip.</p>
                </div>
                <div className="h-[300px] w-full">
                    <SalesChart data={data.revenueTimeSeries} />
                </div>
            </div>

            {/* 4. RANKINGS — two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <KpiGridSkeleton />
        <div className="rounded-xl h-[440px] w-full bg-white border border-slate-200/80 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductRankingCardSkeleton />
            <ProductRankingCardSkeleton />
        </div>
    </div>
);

export default Home;

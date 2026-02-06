import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
  HeaderRight,
} from "@/app/_components/header";
import { SummaryCard, SummaryCardSkeleton } from "@/app/(protected)/_components/summary-card";
import { Suspense } from "react";
import { 
    DollarSignIcon, 
    ShoppingBasketIcon, 
    TrendingUpIcon, 
    PackageIcon
} from "lucide-react";
import { Last14DaysRevenueCard } from "@/app/(protected)/_components/last-14-days-revenue-card";
import MostSoldProducts, {
  MostSoldProductsSkeleton,
} from "@/app/(protected)/_components/most-sold-products";
import LowStockAlerts, { 
  LowStockAlertsSkeleton 
} from "@/app/(protected)/_components/low-stock-alerts";
import { getDashboardAnalytics, DashboardRange } from "@/app/_data-access/dashboard/get-dashboard-analytics";
import { PeriodFilter } from "@/app/_components/period-filter";
import { DataExportButton } from "@/app/_components/data-export-button";
import { formatCurrency } from "@/app/_lib/utils";

export const dynamic = "force-dynamic";

interface HomeProps {
    searchParams: { from?: string; to?: string; range?: string };
}

const Home = async ({ searchParams }: HomeProps) => {
  const range = (searchParams.range as DashboardRange) || 
                ((searchParams.from && searchParams.to) ? "custom" : "7d");

  return (
    <div className="flex flex-col space-y-8 p-8">
      <Header>
        <HeaderLeft className="flex items-center gap-6">
          <div className="space-y-1">
            <HeaderSubtitle>Visão geral dos dados</HeaderSubtitle>
            <HeaderTitle>Dashboard</HeaderTitle>
          </div>
          <PeriodFilter />
        </HeaderLeft>
        <HeaderRight className="flex items-center gap-3">
            <DataExportButton label="Exportar Relatório" />
        </HeaderRight>
      </Header>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <DashboardContent range={range} />
      </Suspense>

      <div className="grid grid-cols-1 gap-6">
          <Suspense fallback={<LowStockAlertsSkeleton />}>
            <LowStockAlerts />
          </Suspense>
      </div>
    </div>
  );
};

const DashboardContent = async ({ range }: { range: DashboardRange }) => {
    const data = await getDashboardAnalytics(range);

    return (
        <div className="space-y-8">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title="Receita Bruta" icon={DollarSignIcon} trend={data.totalRevenue.trend}>
                    <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                        {formatCurrency(data.totalRevenue.value)}
                    </p>
                </SummaryCard>

                <SummaryCard title="Vendas" icon={ShoppingBasketIcon} trend={data.totalSales.trend}>
                    <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                        {data.totalSales.value}
                    </p>
                </SummaryCard>

                <SummaryCard title="Ticket Médio" icon={TrendingUpIcon} trend={data.averageTicket.trend}>
                    <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                        {formatCurrency(data.averageTicket.value)}
                    </p>
                </SummaryCard>

                <SummaryCard title="Lucro Bruto" icon={PackageIcon} trend={data.totalProfit.trend}>
                    <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                        {formatCurrency(data.totalProfit.value)}
                    </p>
                </SummaryCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CHART SECTION */}
                <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-slate-900 italic tracking-tighter">Performance de Receita</h3>
                        <p className="text-xs font-medium text-slate-500">Visualização detalhada da receita dia a dia no período selecionado.</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <Last14DaysRevenueCard data={data.revenueTimeSeries} />
                    </div>
                </div>

                {/* MOST SOLD PRODUCTS */}
                <Suspense fallback={<MostSoldProductsSkeleton />}>
                    <MostSoldProducts />
                </Suspense>
            </div>
        </div>
    );
};

const DashboardLoadingSkeleton = () => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <SummaryCardSkeleton key={i} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[400px] w-full bg-white border border-slate-100 rounded-xl animate-pulse" />
                <MostSoldProductsSkeleton />
            </div>
        </div>
    );
};

export default Home;

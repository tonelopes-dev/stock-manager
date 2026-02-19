import { getDashboardAnalytics, DashboardRange } from "@/app/_data-access/dashboard/get-dashboard-analytics";
import { DateRangePicker } from "@/app/(protected)/_components/date-range-picker";
import { getOnboardingStats } from "../../_data-access/onboarding/get-onboarding-stats";
import { OnboardingGuidedTrigger } from "../_components/onboarding-guided-trigger";
import { KpiGrid, KpiGridSkeleton } from "../_components/kpi-grid";
import { Suspense } from "react";
import { SalesChart } from "../_components/sales-chart";
import { ProductRankingCard, ProductRankingCardSkeleton } from "../_components/product-ranking-card";
import LowStockAlerts, { 
  LowStockAlertsSkeleton 
} from "../_components/low-stock-alerts";
import { ShoppingCartIcon, BellIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Card } from "@/app/_components/ui/card";
import Link from "next/link";
import { TrialOnboardingBanner } from "../_components/trial-onboarding-banner";
import { OnboardingChecklist, OnboardingChecklistSkeleton } from "../_components/onboarding-checklist";

export const dynamic = "force-dynamic";

interface OnboardingStats {
    hasProducts: boolean;
    hasSales: boolean;
    hasMinStock: boolean;
    onboardingStep: number;
    productCount: number;
    saleCount: number;
}

interface HomeProps {
    searchParams: { from?: string; to?: string; range?: string };
}

const Home = async ({ searchParams }: HomeProps) => {
  const range = (searchParams.range as DashboardRange) || 
                ((searchParams.from && searchParams.to) ? "custom" : "30d");

  const onboardingStats = await getOnboardingStats();

  return (
    <div className="flex flex-col space-y-8 p-8 max-w-[1600px] mx-auto w-full">
      {/* GUIDED ONBOARDING TRIGGER */}
      <OnboardingGuidedTrigger hasProducts={onboardingStats?.hasProducts ?? true} />

      {/* ONBOARDING & TRIAL */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Suspense fallback={<div className="h-24 bg-slate-100 animate-pulse rounded-xl" />}>
              <TrialOnboardingBanner />
          </Suspense>
          <Suspense fallback={<OnboardingChecklistSkeleton />}>
              <OnboardingChecklist stats={onboardingStats} />
          </Suspense>
      </div>

      {/* 1. DATE RANGE PICKER */}
      <DateRangePicker />

      {/* DATA CONTENT */}
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <DashboardContent 
            range={range} 
            from={searchParams.from} 
            to={searchParams.to} 
            onboardingStats={onboardingStats || {
                hasProducts: true,
                hasSales: true,
                hasMinStock: true,
                onboardingStep: 1,
                productCount: 0,
                saleCount: 0
            }}
        />
      </Suspense>

      {/* EXTRA: LOW STOCK ALERTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Suspense fallback={<LowStockAlertsSkeleton />}>
            <LowStockAlerts />
          </Suspense>
          
          {(!onboardingStats?.hasSales || !onboardingStats?.hasProducts) && (
              <Card className="shadow-sm bg-slate-50 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center p-8 text-center gap-4">
                  <div className="p-3 bg-white rounded-full shadow-sm text-slate-400">
                      <BellIcon size={24} />
                  </div>
                  <div className="space-y-1">
                      <h4 className="text-sm font-black italic tracking-tighter uppercase text-slate-900">Evite perder vendas</h4>
                      <p className="text-[11px] font-medium text-slate-500 max-w-[240px]">
                          Configure alertas de estoque para ser avisado quando seus itens estiverem acabando.
                      </p>
                  </div>
              </Card>
          )}
      </div>
    </div>
  );
};

const DashboardContent = async ({ 
    range, 
    from, 
    to,
    onboardingStats 
}: { 
    range: DashboardRange; 
    from?: string; 
    to?: string;
    onboardingStats: OnboardingStats;
}) => {
    const data = await getDashboardAnalytics(range, from, to);
    const hasSales = onboardingStats?.hasSales ?? false;

    return (
        <div className="space-y-8">
            {/* 2. KPI GRID */}
            <KpiGrid
                revenue={data.revenue}
                profit={data.profit}
                cogs={data.cogs}
                margin={data.margin}
            />

            {/* 3. SALES CHART or EMPTY STATE */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 italic tracking-tighter uppercase">Análise de Vendas</h3>
                        <p className="text-xs font-medium text-slate-500">Receita vs. Lucro por dia — COGS visível no tooltip.</p>
                    </div>
                </div>

                {!hasSales ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-center gap-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <div className="p-4 bg-primary/10 rounded-full text-primary">
                            <ShoppingCartIcon size={32} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-base font-black italic tracking-tighter uppercase text-slate-900">Nenhuma venda registrada ainda</h4>
                            <p className="text-xs font-medium text-slate-500 max-w-[300px] mx-auto">
                                Assim que você registrar sua primeira venda, este gráfico mostrará seu lucro detalhado dia a dia.
                            </p>
                        </div>
                        <Button className="font-black italic tracking-tighter uppercase" asChild>
                            <Link href="/sales">
                                Registrar Primeira Venda
                                <ArrowRightIcon size={16} className="ml-2" />
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="h-[300px] w-full">
                        <SalesChart data={data.revenueTimeSeries} />
                    </div>
                )}
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

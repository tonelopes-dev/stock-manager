import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "../../_components/header";
import { ComboboxOption } from "../../_components/ui/combobox";
import { getProducts, ProductDto } from "../../_data-access/product/get-products";
import { getSales } from "../../_data-access/sale/get-sales";
import UpsertSaleButton from "./_components/create-sale-button";
import { SalesDataTable } from "./_components/sales-data-table";
import { Suspense } from "react";
import { SaleTableSkeleton } from "./_components/table-skeleton";
import { PeriodFilter } from "@/app/_components/period-filter";
import { getSalesAnalytics } from "@/app/_data-access/sale/get-sales-analytics";
import { SalesSummary } from "./_components/sales-summary";
import { SalesCharts } from "./_components/sales-charts";
import { MonthComparisonFilter } from "./_components/month-comparison-filter";
import { SalesViewTabs } from "./_components/sales-view-tabs";
import { ExportReportModal } from "./_components/export-report-modal";
import { SalesComparisonMetrics } from "./_components/sales-comparison-metrics";
import { getOnboardingStats } from "@/app/_data-access/onboarding/get-onboarding-stats";
import { getCurrentUserRole } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";

// Page requires session for company filtering
export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: { 
    from?: string; 
    to?: string; 
    range?: string;
    page?: string;
    pageSize?: string;
    monthA?: string;
    monthB?: string;
    view?: "gestao" | "inteligencia";
  };
}

const SalesPage = async ({ searchParams }: HomeProps) => {
  const products = await getProducts();
  const productOptions: ComboboxOption[] = products.map((product) => ({
    label: `${product.name} - ${Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(product.price))}`,
    value: product.id,
  }));

  const view = searchParams.view || "gestao";
  const role = await getCurrentUserRole();
  const onboardingStats = await getOnboardingStats();

  const analytics = await getSalesAnalytics(
    searchParams.from, 
    searchParams.to,
    searchParams.monthA,
    searchParams.monthB
  );

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Header>
        <HeaderLeft className="flex flex-col items-start gap-4">
          <div className="space-y-1">
            <HeaderSubtitle>Gestão de Vendas</HeaderSubtitle>
            <HeaderTitle>Vendas</HeaderTitle>
          </div>
          <div className="flex items-center gap-4">
            <SalesViewTabs />
            {view === "gestao" ? <PeriodFilter /> : <MonthComparisonFilter />}
          </div>
        </HeaderLeft>
        <HeaderRight className="flex items-center gap-3">
          <ExportReportModal />
          <UpsertSaleButton
            products={products}
            productOptions={productOptions}
            hasSales={onboardingStats?.hasSales ?? true}
          />
        </HeaderRight>
      </Header>

      {view === "inteligencia" && (
        <div className="space-y-8">
          <SalesComparisonMetrics comparison={analytics.monthlyComparison} />
          <SalesCharts comparison={analytics.monthlyComparison} />
        </div>
      )}

      {view === "gestao" && (
        <div className="space-y-8">
            <SalesSummary 
                totalRevenue={analytics.totalRevenue}
                totalProfit={analytics.totalProfit}
                averageTicket={analytics.averageTicket}
                totalSales={analytics.totalSales}
            />

            <Suspense fallback={<SaleTableSkeleton />}>
                <SalesTableWrapper 
                    productOptions={productOptions} 
                    products={products} 
                    from={searchParams.from} 
                    to={searchParams.to} 
                    page={Number(searchParams.page) || 1}
                    pageSize={Number(searchParams.pageSize) || 10}
                    userRole={role as UserRole}
                />
            </Suspense>
        </div>
      )}
    </div>
  );
};

interface SalesTableWrapperProps {
  productOptions: ComboboxOption[];
  products: ProductDto[];
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
  userRole: UserRole;
}

const SalesTableWrapper = async ({ 
  productOptions, 
  products,
  from,
  to,
  page,
  pageSize,
  userRole,
}: SalesTableWrapperProps) => {
  const { data: sales, total } = await getSales({ from, to, page, pageSize });
  
  const tableData = sales.map((sale) => ({
    ...sale,
    products,
    productOptions,
  }));

  return (
    <SalesDataTable 
      sales={tableData}
      total={total}
      page={page}
      pageSize={pageSize}
      userRole={userRole}
    />
  );
};

export default SalesPage;

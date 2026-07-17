import { PeriodFilter } from "@/app/_components/period-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { getCRMStages } from "@/app/_data-access/crm/get-crm-stages";
import { getCustomerCategories } from "@/app/_data-access/customer/get-customer-categories";
import { getOnboardingStats } from "@/app/_data-access/onboarding/get-onboarding-stats";
import { getActiveComandas } from "@/app/_data-access/order/get-active-comandas";
import { getAggregatedSales } from "@/app/_data-access/sale/get-aggregated-sales";
import { getPendingReceivables } from "@/app/_data-access/sale/get-pending-receivables";
import { getSalesAnalytics, SalesAnalyticsDto } from "@/app/_data-access/sale/get-sales-analytics";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { getCurrentUserRole } from "@/app/_lib/rbac";
import { todayBRT } from "@/app/_utils/date";
import { UserRole } from "@prisma/client";
import { Suspense } from "react";
import { HeaderSubtitle, HeaderTitle } from "../../_components/header";
import { ComboboxOption } from "../../_components/ui/combobox";
import { getCustomersForCombobox } from "../../_data-access/customer/get-customers";
import {
  getProductsForSale,
  ProductDto
} from "../../_data-access/product/get-products";
import { getSaleById, getSales, getSalesForTips, SaleDto } from "../../_data-access/sale/get-sales";
import { AggregatedSalesTable } from "./_components/aggregated-sales-table";
import UpsertSaleButton from "./_components/create-sale-button";
import { ExportReportModal } from "./_components/export-report-modal";
import { GestaoTabs } from "./_components/gestao-tabs";
import { ProductSalesChart } from "./_components/product-sales-chart";
import { SalesDataTable } from "./_components/sales-data-table";
import { SalesSummary } from "./_components/sales-summary";
import { SalesViewTabs } from "./_components/sales-view-tabs";
import { SaleTableSkeleton } from "./_components/table-skeleton";
import { TipsReport } from "./_components/tips-report";

// Page requires session for company filtering
export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    range?: string;
    page?: string;
    pageSize?: string;
    monthA?: string;
    monthB?: string;
    view?: "gestao" | "inteligencia" | "gorjetas";
    saleId?: string;
    customerId?: string;
    action?: string;
  }>;
}

const SalesPage = async ({ searchParams }: HomeProps) => {
  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams.view || "gestao";
  const companyId = await getCurrentCompanyId();
  
  // 1. Parallelize core metadata fetches (using optimized combobox versions)
  const [products, customersRaw, role, onboardingStats, stages, categories] = await Promise.all([
    getProductsForSale(),
    getCustomersForCombobox(),
    getCurrentUserRole(),
    getOnboardingStats(),
    getCRMStages(),
    getCustomerCategories(),
  ]);

  const productOptions: ComboboxOption[] = products.map((product) => ({
    label: `${product.name} - ${Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(product.price))}`,
    value: product.id,
  }));

  const customerOptions: ComboboxOption[] = customersRaw.map((customer) => ({
    label: `${customer.name} ${customer.phone ? `(${customer.phone})` : ""}`,
    value: customer.id,
    imageUrl: customer.imageUrl,
  }));

  const currentPage = Number(resolvedSearchParams.page) || 1;
  const pageSize = Number(resolvedSearchParams.pageSize) || 12;

  const from = resolvedSearchParams.from;
  const to = resolvedSearchParams.to;
  
  const today = todayBRT();
  const analyticsFrom = from || today;
  const analyticsTo = to || today;

  // 2. Fetch business data in parallel (conditionally)
  const [analytics, aggregatedData, activeComandas, salesResult, preFetchedSale, pendingReceivables] = await Promise.all([
    // Only fetch analytics if needed
    (view === "inteligencia" || view === "gorjetas") 
      ? getSalesAnalytics(analyticsFrom, analyticsTo, resolvedSearchParams.monthA, resolvedSearchParams.monthB)
      : Promise.resolve(null),
    
    // Only fetch aggregated if in inteligencia view
    view === "inteligencia"
      ? getAggregatedSales(analyticsFrom, analyticsTo)
      : Promise.resolve({ items: [], totalTips: 0, totalRevenue: 0 }),
      
    companyId ? getActiveComandas() : Promise.resolve([]),
    
    getSales({
      from: from || undefined,
      to: to || undefined,
      page: currentPage,
      pageSize: pageSize,
    }),

    resolvedSearchParams.saleId ? getSaleById(resolvedSearchParams.saleId) : Promise.resolve(null),
    getPendingReceivables(),
  ]);

  const { data: closedSales, total: totalClosedSales } = salesResult;

  return (
    <div className="space-y-8 overflow-auto rounded-lg bg-background p-3 sm:p-4 md:p-8">
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <HeaderSubtitle>
            {view === "gestao" ? "Operação de Vendas" : view === "inteligencia" ? "Painel Operacional" : "Financeiro Staff"}
          </HeaderSubtitle>
          <HeaderTitle>Vendas</HeaderTitle>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <SalesViewTabs />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {view === "inteligencia" && <PeriodFilter />}
            {view === "inteligencia" && <ExportReportModal />}
            <UpsertSaleButton
              products={products}
              productOptions={productOptions}
              customerOptions={customerOptions}
              hasSales={onboardingStats?.hasSales ?? true}
              view={view as "gestao" | "inteligencia"}
              companyId={companyId || ""}
              stages={stages}
              categories={categories}
            />
          </div>
        </div>
      </div>

      {view === "inteligencia" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="md:col-span-1 lg:col-span-1">
               <Card className="border-none bg-emerald-500 text-white shadow-lg overflow-hidden h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Gorjetas Totais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black italic tracking-tighter">
                      {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(aggregatedData.totalTips)}
                    </div>
                    <p className="text-[10px] font-bold mt-1 opacity-70 uppercase tracking-tight">Período selecionado</p>
                  </CardContent>
               </Card>
            </div>
            <div className="md:col-span-2 lg:col-span-4">
               {analytics && (
                 <SalesSummary 
                    totalRevenue={analytics.totalRevenue}
                    totalProfit={analytics.totalProfit}
                    averageTicket={analytics.averageTicket}
                    totalSales={analytics.totalSales}
                 />
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ProductSalesChart data={aggregatedData.items} />
            </div>
            <div className="lg:col-span-2">
              <AggregatedSalesTable data={aggregatedData.items} />
            </div>
          </div>
        </div>
      )}

      {view === "gestao" && (
        <div className="space-y-8">
          <Suspense fallback={null}>
            <GestaoTabs
              initialComandas={activeComandas}
              initialClosedSales={closedSales}
              initialReceivables={pendingReceivables}
              totalClosedSales={totalClosedSales}
              currentClosedPage={currentPage}
              currentClosedPageSize={pageSize}
              companyId={companyId || ""}
              products={products}
              productOptions={productOptions}
              customerOptions={customerOptions}
              stages={stages}
              categories={categories}
            />
          </Suspense>
        </div>
      )}

      {view === "gorjetas" && (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-muted-foreground">
                Detalhamento de Gorjetas
              </h3>
              <p className="text-[10px] font-medium text-muted-foreground">
                Acompanhamento individual para repasse à equipe
              </p>
            </div>
            <PeriodFilter />
          </div>
          <Suspense fallback={<SaleTableSkeleton />}>
            <TipsReportWrapper
              from={analyticsFrom}
              to={analyticsTo}
              analytics={analytics}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};


const TipsReportWrapper = async ({
  from,
  to,
  analytics,
}: {
  from?: string;
  to?: string;
  analytics: SalesAnalyticsDto | null;
}) => {
  const sales = await getSalesForTips({ from, to });

  if (!analytics) return null;

  return <TipsReport sales={sales} totalTips={analytics.totalTips.value} />;
};

interface SalesTableWrapperProps {
  productOptions: ComboboxOption[];
  products: ProductDto[];
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
  userRole: UserRole;
  companyId: string;
  preFetchedSale?: SaleDto | null;
  stages: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

const SalesTableWrapper = async ({
  productOptions,
  products,
  from,
  to,
  page,
  pageSize,
  userRole,
  customerOptions,
  companyId,
  preFetchedSale,
  stages,
  categories,
}: SalesTableWrapperProps & { customerOptions: ComboboxOption[] }) => {
  const { data: sales, total } = await getSales({ from, to, page, pageSize });

  const tableData = sales.map((sale) => ({
    ...sale,
    products,
    productOptions,
    customerOptions,
  }));

  return (
    <SalesDataTable
      sales={tableData}
      total={total}
      page={page}
      pageSize={pageSize}
      userRole={userRole}
      customerOptions={customerOptions}
      companyId={companyId}
      preFetchedSale={preFetchedSale}
      stages={stages}
      categories={categories}
    />
  );
};

export default SalesPage;

import { getActiveComandas } from "@/app/_data-access/order/get-active-comandas";
import { ComandasGrid } from "./_components/comandas-grid";
import { GestaoTabs } from "./_components/gestao-tabs";
import { Plus } from "lucide-react";
import { HeaderSubtitle, HeaderTitle } from "../../_components/header";
import { ComboboxOption } from "../../_components/ui/combobox";
import {
  getProducts,
  ProductDto,
} from "../../_data-access/product/get-products";
import { getCustomers } from "../../_data-access/customer/get-customers";
import { getSales, getSaleById, SaleDto } from "../../_data-access/sale/get-sales";
import { getCRMStages } from "@/app/_data-access/crm/get-crm-stages";
import { getCustomerCategories } from "@/app/_data-access/customer/get-customer-categories";
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
import { TipsReport } from "./_components/tips-report";
import { ExportReportModal } from "./_components/export-report-modal";
import { SalesComparisonMetrics } from "./_components/sales-comparison-metrics";
import { getOnboardingStats } from "@/app/_data-access/onboarding/get-onboarding-stats";
import { getCurrentUserRole } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { getPendingOrders } from "@/app/_data-access/order/get-pending-orders";
import { PendingOrdersBanner } from "./_components/pending-orders-banner";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { getAggregatedSales } from "@/app/_data-access/sale/get-aggregated-sales";
import { ProductSalesChart } from "./_components/product-sales-chart";
import { AggregatedSalesTable } from "./_components/aggregated-sales-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";

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
  const products = await getProducts();
  const productOptions: ComboboxOption[] = products.map((product) => ({
    label: `${product.name} - ${Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(product.price))}`,
    value: product.id,
  }));

  const { data: customers } = await getCustomers(undefined, undefined, 1, 1000);
  const customerOptions: ComboboxOption[] = customers.map((customer) => ({
    label: `${customer.name} ${customer.phoneNumber ? `(${customer.phoneNumber})` : ""}`,
    value: customer.id,
  }));

  const view = resolvedSearchParams.view || "gestao";
  const role = await getCurrentUserRole();
  const onboardingStats = await getOnboardingStats();
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const pageSize = Number(resolvedSearchParams.pageSize) || 12; // User requested 12 items as default

  // Standardize filter periods
  // If no date range is provided, we don't force 'today' for the Gestao view history query
  const from = resolvedSearchParams.from;
  const to = resolvedSearchParams.to;
  
  // But for analytics and inteligência, we still need a default range to avoid performance issues
  const today = new Date().toISOString().split("T")[0];
  const analyticsFrom = from || today;
  const analyticsTo = to || today;

  const analytics = await getSalesAnalytics(
    analyticsFrom,
    analyticsTo,
    resolvedSearchParams.monthA,
    resolvedSearchParams.monthB,
  );
  
  const aggregatedData = view === "inteligencia" 
    ? await getAggregatedSales(analyticsFrom, analyticsTo)
    : { items: [], totalTips: 0, totalRevenue: 0 };

  const stages = await getCRMStages();
  const categories = await getCustomerCategories();

  const companyId = await getCurrentCompanyId();
  const activeComandas = companyId ? await getActiveComandas() : [];
  
  // Fetch closed sales with PAGINATION and OPTIONAL date filters
  const { data: closedSales, total: totalClosedSales } = await getSales({
    from: from || undefined,
    to: to || undefined,
    query: undefined,
    page: currentPage,
    pageSize: pageSize,
  });

  // Server-side pre-fetching for deep-linked sale
  let preFetchedSale: SaleDto | null = null;
  if (resolvedSearchParams.saleId) {
    preFetchedSale = await getSaleById(resolvedSearchParams.saleId);
  }

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-background p-8">
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <HeaderSubtitle>
            {view === "gestao" ? "Operação de Vendas" : view === "inteligencia" ? "Painel Operacional" : "Financeiro Staff"}
          </HeaderSubtitle>
          <HeaderTitle>Vendas</HeaderTitle>
        </div>

        <div className="flex items-center justify-between">
          <SalesViewTabs />
          <div className="flex items-center gap-3">
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
               <SalesSummary 
                  totalRevenue={analytics.totalRevenue}
                  totalProfit={analytics.totalProfit}
                  averageTicket={analytics.averageTicket}
                  totalSales={analytics.totalSales}
               />
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
          <GestaoTabs
            initialComandas={activeComandas}
            initialClosedSales={closedSales}
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
}: {
  from?: string;
  to?: string;
}) => {
  const { data: sales } = await getSales({ from, to, page: 1, pageSize: 1000 }); // Large page size to see all tips
  const analytics = await getSalesAnalytics(from, to);

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

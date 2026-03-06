import { getActiveComandas } from "@/app/_data-access/order/get-active-comandas";
import { ComandasGrid } from "./_components/comandas-grid";
import { Plus } from "lucide-react";
import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "../../_components/header";
import { ComboboxOption } from "../../_components/ui/combobox";
import {
  getProducts,
  ProductDto,
} from "../../_data-access/product/get-products";
import { getCustomers } from "../../_data-access/customer/get-customers";
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
import { getPendingOrders } from "@/app/_data-access/order/get-pending-orders";
import { PendingOrdersBanner } from "./_components/pending-orders-banner";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

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
    view?: "gestao" | "inteligencia";
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

  const analytics = await getSalesAnalytics(
    resolvedSearchParams.from,
    resolvedSearchParams.to,
    resolvedSearchParams.monthA,
    resolvedSearchParams.monthB,
  );

  const companyId = await getCurrentCompanyId();
  const activeComandas = companyId ? await getActiveComandas() : [];

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Header>
        <HeaderLeft className="flex flex-col items-start gap-4">
          <div className="space-y-1">
            <HeaderSubtitle>
              {view === "gestao"
                ? "Operação de Vendas"
                : "Análise de Resultados"}
            </HeaderSubtitle>
            <HeaderTitle>Vendas</HeaderTitle>
          </div>
          <div className="flex items-center gap-4">
            <SalesViewTabs />
            {view === "inteligencia" && (
              <div className="flex items-center gap-4">
                <PeriodFilter />
                <MonthComparisonFilter />
              </div>
            )}
          </div>
        </HeaderLeft>
        <HeaderRight className="flex items-center gap-3">
          {view === "inteligencia" && <ExportReportModal />}
          <UpsertSaleButton
            products={products}
            productOptions={productOptions}
            customerOptions={customerOptions}
            hasSales={onboardingStats?.hasSales ?? true}
          />
        </HeaderRight>
      </Header>

      {view === "inteligencia" && (
        <div className="space-y-8">
          <SalesComparisonMetrics comparison={analytics.monthlyComparison} />
          <SalesCharts comparison={analytics.monthlyComparison} />

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-slate-500">
                Listagem Técnica de Vendas
              </h3>
              <p className="text-[10px] font-medium text-slate-400">
                Detalhamento individual de cada operação realizada no período
              </p>
            </div>
            <Suspense fallback={<SaleTableSkeleton />}>
              <SalesTableWrapper
                customerOptions={customerOptions}
                productOptions={productOptions}
                products={products}
                from={resolvedSearchParams.from}
                to={resolvedSearchParams.to}
                page={Number(resolvedSearchParams.page) || 1}
                pageSize={Number(resolvedSearchParams.pageSize) || 10}
                userRole={role as UserRole}
              />
            </Suspense>
          </div>
        </div>
      )}

      {view === "gestao" && (
        <div className="space-y-8">
          <ComandasGrid
            initialComandas={activeComandas}
            companyId={companyId || ""}
          />
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
  customerOptions,
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
    />
  );
};

export default SalesPage;

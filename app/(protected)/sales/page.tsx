import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "../../_components/header";
import { ComboboxOption } from "../../_components/ui/combobox";
import { DataTable } from "../../_components/ui/data-table";
import { getProducts } from "../../_data-access/product/get-products";
import { getSales } from "../../_data-access/sale/get-sales";
import UpsertSaleButton from "./_components/create-sale-button";
import { saleTableColumns } from "./_components/table-columns";
import { ShoppingCartIcon } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";
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

import { Product } from "@prisma/client";

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
    label: product.name,
    value: product.id,
  }));

  const view = searchParams.view || "gestao";

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
                />
            </Suspense>
        </div>
      )}
    </div>
  );
};

const SalesTableWrapper = async ({ 
  productOptions, 
  products,
  from,
  to,
  page,
  pageSize
}: { 
  productOptions: ComboboxOption[], 
  products: Product[],
  from?: string,
  to?: string,
  page: number,
  pageSize: number
}) => {
  const { data: sales, total } = await getSales({ from, to, page, pageSize });
  
  const tableData = sales.map((sale) => ({
    ...sale,
    products,
    productOptions,
  }));

  return (
    <DataTable 
      columns={saleTableColumns} 
      data={tableData} 
      pagination={{
        total,
        page,
        pageSize
      }}
      emptyMessage={
        <EmptyState
          icon={ShoppingCartIcon}
          title="Nenhuma venda encontrada"
          description="Você ainda não realizou nenhuma venda. Que tal começar agora?"
        />
      }
    />
  );
};

export default SalesPage;
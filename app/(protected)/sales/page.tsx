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
import { DataExportButton } from "@/app/_components/data-export-button";
import { PeriodFilter } from "@/app/_components/period-filter";
import { getSalesAnalytics } from "@/app/_data-access/sale/get-sales-analytics";
import { SalesSummary } from "./_components/sales-summary";
import { SalesCharts } from "./_components/sales-charts";
import { MonthComparisonFilter } from "./_components/month-comparison-filter";

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
  };
}

const SalesPage = async ({ searchParams }: HomeProps) => {
  const products = await getProducts();
  const productOptions: ComboboxOption[] = products.map((product) => ({
    label: product.name,
    value: product.id,
  }));

  const analytics = await getSalesAnalytics(
    searchParams.from, 
    searchParams.to,
    searchParams.monthA,
    searchParams.monthB
  );

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Header>
        <HeaderLeft className="flex items-center gap-6">
          <div className="space-y-1">
            <HeaderSubtitle>Gestão de Vendas</HeaderSubtitle>
            <HeaderTitle>Vendas</HeaderTitle>
          </div>
          <PeriodFilter />
          <MonthComparisonFilter />
        </HeaderLeft>
        <HeaderRight className="flex items-center gap-3">
          <DataExportButton />
          <UpsertSaleButton
            products={products}
            productOptions={productOptions}
          />
        </HeaderRight>
      </Header>

      <SalesSummary 
        totalRevenue={analytics.totalRevenue}
        totalProfit={analytics.totalProfit}
        averageTicket={analytics.averageTicket}
      />

      <SalesCharts 
        monthlyComparison={analytics.monthlyComparison}
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
  products: any[],
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
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

// Page requires session for company filtering
export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: { from?: string; to?: string; range?: string };
}

const SalesPage = async ({ searchParams }: HomeProps) => {
  const products = await getProducts();
  const productOptions: ComboboxOption[] = products.map((product) => ({
    label: product.name,
    value: product.id,
  }));

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Header>
        <HeaderLeft className="flex items-center gap-6">
          <div className="space-y-1">
            <HeaderSubtitle>Gestão de Vendas</HeaderSubtitle>
            <HeaderTitle>Vendas</HeaderTitle>
          </div>
          <PeriodFilter />
        </HeaderLeft>
        <HeaderRight className="flex items-center gap-3">
          <DataExportButton />
          <UpsertSaleButton
            products={products}
            productOptions={productOptions}
          />
        </HeaderRight>
      </Header>

      <Suspense fallback={<SaleTableSkeleton />}>
        <SalesTableWrapper 
            productOptions={productOptions} 
            products={products} 
            from={searchParams.from} 
            to={searchParams.to} 
        />
      </Suspense>
    </div>
  );
};

const SalesTableWrapper = async ({ 
  productOptions, 
  products,
  from,
  to
}: { 
  productOptions: ComboboxOption[], 
  products: any[],
  from?: string,
  to?: string
}) => {
  const sales = await getSales({ from, to });
  
  const tableData = sales.map((sale) => ({
    ...sale,
    products,
    productOptions,
  }));

  return (
    <DataTable 
      columns={saleTableColumns} 
      data={tableData} 
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
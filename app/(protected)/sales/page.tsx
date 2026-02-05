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

// Page requires session for company filtering
export const dynamic = "force-dynamic";

const SalesPage = async () => {
  const products = await getProducts();
  const productOptions: ComboboxOption[] = products.map((product) => ({
    label: product.name,
    value: product.id,
  }));

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gestão de Vendas</HeaderSubtitle>
          <HeaderTitle>Vendas</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          <UpsertSaleButton
            products={products}
            productOptions={productOptions}
          />
        </HeaderRight>
      </Header>

      <Suspense fallback={<SaleTableSkeleton />}>
        <SalesTableWrapper productOptions={productOptions} products={products} />
      </Suspense>
    </div>
  );
};

const SalesTableWrapper = async ({ 
  productOptions, 
  products 
}: { 
  productOptions: ComboboxOption[], 
  products: any[] 
}) => {
  const sales = await getSales();
  
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
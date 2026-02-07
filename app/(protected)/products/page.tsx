import { DataTable } from "../../_components/ui/data-table";
import { productTableColumns } from "./_components/table-columns";
import { getProducts } from "../../_data-access/product/get-products";
import AddProductButton from "./_components/create-product-button";
import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "../../_components/header";

import { PackageSearchIcon } from "lucide-react";
import { EmptyState } from "../../_components/empty-state";
import { Suspense } from "react";
import { ProductTableSkeleton } from "./_components/table-skeleton";

// Page requires session for company filtering
export const dynamic = "force-dynamic";

const ProductsPage = async () => {
  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Suspense fallback={<ProductTableSkeleton />}>
        <ProductTableWrapper />
      </Suspense>
    </div>
  );
};

const ProductTableWrapper = async () => {
  const products = await getProducts();
  return (
    <div className="space-y-6">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gestão de Produtos</HeaderSubtitle>
          <HeaderTitle>Produtos</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          <div className="flex gap-3">
             <AddProductButton />
          </div>
        </HeaderRight>
      </Header>

      <DataTable 
        columns={productTableColumns} 
        data={products} 
        emptyMessage={
          <EmptyState
            icon={PackageSearchIcon}
            title="Nenhum produto encontrado"
            description="Você ainda não cadastrou nenhum produto. Comece adicionando o seu primeiro item!"
          />
        }
      />
    </div>
  );
};

export default ProductsPage;
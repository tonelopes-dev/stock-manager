import { DataTable } from "../_components/ui/data-table";
import { productsTableColumns } from "./_components/table-columns";
import { getProducts } from "../_data-access/product/get-products";

import AddProductButton from "./_components/add-product-button";

const ProductsPage = async () => {
  const products = await getProducts();

  return (
    <div className="ml-1 w-full space-y-8 bg-white pb-8 pl-6 pr-8 pt-8">
      <div className="flex w-full items-center justify-between">
        <div className="space-y-1">
          <span className="text-sx font-semibold text-slate-500">
            Gestão de Produtos
          </span>
          <h2 className="text-xl font-semibold">Produtos</h2>
        </div>

        <AddProductButton />
      </div>

      <DataTable
        columns={productsTableColumns}
        data={JSON.parse(JSON.stringify(products))}
      />
    </div>
  );
};

export default ProductsPage;

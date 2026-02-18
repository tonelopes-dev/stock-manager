"use client";

import { DataTable } from "@/app/_components/ui/data-table";
import { productTableColumns } from "./table-columns";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { EmptyState } from "@/app/_components/empty-state";
import { PackageSearchIcon } from "lucide-react";

interface ProductDataTableProps {
  products: ProductDto[];
}

export const ProductDataTable = ({ products }: ProductDataTableProps) => {
  return (
    <DataTable
      columns={productTableColumns}
      data={products}
      getRowClassName={(product) =>
        !product.isActive
          ? "opacity-50 pointer-events-none sm:pointer-events-auto"
          : ""
      }
      emptyMessage={
        <EmptyState
          icon={PackageSearchIcon}
          title="Nenhum produto encontrado"
          description="Você ainda não cadastrou nenhum produto ou o filtro atual não retornou resultados."
        />
      }
    />
  );
};

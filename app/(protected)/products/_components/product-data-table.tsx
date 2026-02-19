"use client";

import { DataTable } from "@/app/_components/ui/data-table";
import { productTableColumns } from "./table-columns";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { EmptyState } from "@/app/_components/empty-state";
import { PackageSearchIcon } from "lucide-react";
import { UserRole } from "@prisma/client";


interface ProductDataTableProps {
  products: ProductDto[];
  userRole: UserRole;
}

export const ProductDataTable = ({ products, userRole }: ProductDataTableProps) => {
  return (
    <DataTable
      columns={productTableColumns(userRole)}
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

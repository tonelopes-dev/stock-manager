"use client";

import { DataTable } from "@/app/_components/ui/data-table";
import { saleTableColumns } from "./table-columns";
import { SaleDto } from "@/app/_data-access/sale/get-sales";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";
import { EmptyState } from "@/app/_components/empty-state";
import { ShoppingCartIcon } from "lucide-react";
import { UserRole } from "@prisma/client";

interface SaleTableColumn extends SaleDto {
  products: ProductDto[];
  productOptions: ComboboxOption[];
  customerOptions: ComboboxOption[];
}

interface SalesDataTableProps {
  sales: SaleTableColumn[];
  total: number;
  page: number;
  pageSize: number;
  userRole: UserRole;
  customerOptions: ComboboxOption[];
  companyId: string;
}

export const SalesDataTable = ({
  sales,
  total,
  page,
  pageSize,
  userRole,
  customerOptions,
  companyId,
}: SalesDataTableProps) => {
  return (
    <DataTable
      columns={saleTableColumns(userRole, customerOptions, companyId)}
      data={sales}
      pagination={{
        total,
        page,
        pageSize,
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

"use client";

import { SaleDto } from "@/app/_data-access/sale/get-sales";
import { formatCurrency } from "@/app/_helpers/currency";
import { ColumnDef } from "@tanstack/react-table";
import SalesTableDropdownMenu from "./table-dropdown-menu";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";
import { format } from "date-fns";

interface SaleTableColumn extends SaleDto {
  products: ProductDto[];
  productOptions: ComboboxOption[];
}

import { UserRole } from "@prisma/client";

export const saleTableColumns = (
  userRole: UserRole,
  customerOptions: ComboboxOption[],
): ColumnDef<SaleTableColumn>[] => [
  {
    accessorKey: "customerName",
    header: "Cliente",
    cell: ({ row: { original: sale } }) => sale.customerName || "-",
  },
  {
    accessorKey: "productNames",
    header: "Produtos",
  },
  {
    accessorKey: "totalProducts",
    header: "Quantidade de Produtos",
  },
  {
    header: "Valor Total",
    cell: ({
      row: {
        original: { totalAmount },
      },
    }) => formatCurrency(totalAmount),
  },
  {
    header: "Data",
    cell: ({
      row: {
        original: { date },
      },
    }) => format(new Date(date), "dd/MM/yyyy"),
  },
  {
    header: "Ações",
    cell: ({ row: { original: sale } }) => (
      <SalesTableDropdownMenu
        sale={sale}
        products={sale.products}
        productOptions={sale.productOptions}
        customerOptions={customerOptions}
        userRole={userRole}
      />
    ),
  },
];

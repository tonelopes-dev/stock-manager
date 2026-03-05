"use client";

import { SaleDto } from "@/app/_data-access/sale/get-sales";
import { formatCurrency } from "@/app/_helpers/currency";
import { ColumnDef } from "@tanstack/react-table";
import SalesTableDropdownMenu from "./table-dropdown-menu";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";
import { format } from "date-fns";
import { PaymentMethod, UserRole } from "@prisma/client";
import {
  BanknoteIcon,
  SmartphoneIcon,
  CreditCardIcon,
  WalletIcon,
} from "lucide-react";

interface SaleTableColumn extends SaleDto {
  products: ProductDto[];
  productOptions: ComboboxOption[];
}

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
    header: "Pagamento",
    cell: ({
      row: {
        original: { paymentMethod },
      },
    }) => {
      switch (paymentMethod) {
        case "CASH":
          return (
            <div className="flex items-center gap-1.5 font-bold text-emerald-600">
              <BanknoteIcon size={14} />
              Dinheiro
            </div>
          );
        case "PIX":
          return (
            <div className="flex items-center gap-1.5 font-bold text-cyan-600">
              <SmartphoneIcon size={14} />
              PIX
            </div>
          );
        case "CREDIT_CARD":
          return (
            <div className="flex items-center gap-1.5 font-bold text-indigo-600">
              <CreditCardIcon size={14} />
              Crédito
            </div>
          );
        case "DEBIT_CARD":
          return (
            <div className="flex items-center gap-1.5 font-bold text-blue-600">
              <WalletIcon size={14} />
              Débito
            </div>
          );
        default:
          return <span className="font-medium text-slate-400">-</span>;
      }
    },
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

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CustomerDto } from "@/app/_data-access/customer/get-customers";
import { Badge } from "@/app/_components/ui/badge";
import CustomerTableDropdownMenu from "./table-dropdown-menu";
import { UserRole } from "@prisma/client";

export const CUSTOMER_CATEGORY_LABELS: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  LEAD: { label: "Lead", variant: "secondary" },
  REGULAR: { label: "Regular", variant: "outline" },
  VIP: { label: "VIP", variant: "default" },
  INACTIVE: { label: "Inativo", variant: "destructive" },
};

export const customerTableColumns = (
  userRole: UserRole,
): ColumnDef<CustomerDto>[] => [
  {
    accessorKey: "name",
    header: "Cliente",
  },
  {
    accessorKey: "email",
    header: "E-mail",
    cell: ({ row: { original: customer } }) => customer.email || "-",
  },
  {
    accessorKey: "phone",
    header: "Telefone",
    cell: ({ row: { original: customer } }) => customer.phone || "-",
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row: { original: customer } }) => {
      const config =
        CUSTOMER_CATEGORY_LABELS[customer.category] ||
        CUSTOMER_CATEGORY_LABELS.LEAD;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: "salesCount",
    header: "Vendas",
    cell: ({ row: { original: customer } }) => customer._count.sales,
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: (row) => (
      <CustomerTableDropdownMenu
        customer={row.row.original}
        userRole={userRole}
      />
    ),
  },
];

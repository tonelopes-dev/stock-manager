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
  categories: { id: string; name: string }[],
  stages: { id: string; name: string }[],
  onDelete?: (customerId: string) => void,
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
    accessorKey: "categories",
    header: "Categorias",
    cell: ({ row: { original: customer } }) => {
      if (!customer.categories || customer.categories.length === 0) return "-";
      return (
        <div className="flex flex-wrap gap-1">
          {customer.categories.slice(0, 1).map((category) => (
            <Badge
              key={category.id}
              variant="outline"
              style={
                category.color
                  ? {
                      borderColor: `${category.color}40`,
                      color: category.color,
                      backgroundColor: `${category.color}10`,
                    }
                  : undefined
              }
              className="border-slate-200 text-slate-600"
            >
              {category.name}
            </Badge>
          ))}
          {customer.categories.length > 1 && (
            <Badge variant="secondary" className="bg-slate-100 text-slate-400">
              +{customer.categories.length - 1}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "stage",
    header: "Estágio CRM",
    cell: ({ row: { original: customer } }) => {
      if (!customer.stage) return "-";
      return (
        <Badge
          variant={
            customer.stage.name === "Convertido" ? "default" : "secondary"
          }
        >
          {customer.stage.name}
        </Badge>
      );
    },
  },
  {
    accessorKey: "totalSpent",
    header: "Total Gasto",
    cell: ({ row: { original: customer } }) => {
      const { formatCurrency } = require("@/app/_helpers/currency");
      return (
        <span className="font-bold text-slate-700">
          {formatCurrency(customer.totalSpent)}
        </span>
      );
    },
  },
  {
    accessorKey: "lastSaleDate",
    header: "Última Compra",
    cell: ({ row: { original: customer } }) => {
      if (!customer.lastSaleDate) return "-";
      const { format } = require("date-fns");
      const { ptBR } = require("date-fns/locale/pt-BR");
      return format(new Date(customer.lastSaleDate), "dd/MM/yyyy", {
        locale: ptBR,
      });
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
        categories={categories}
        stages={stages}
        onDelete={onDelete}
      />
    ),
  },
];

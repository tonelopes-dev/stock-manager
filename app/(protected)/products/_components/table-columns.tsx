"use client";

import { ColumnDef } from "@tanstack/react-table";
import ProductTableDropdownMenu from "./table-dropdown-menu";
import { ProductDto } from "@/app/_data-access/product/get-products";
import ProductStatusBadge from "@/app/_components/product-status-badge";
import { Badge } from "@/app/_components/ui/badge";

const PRODUCT_TYPE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  RESELL: { label: "Revenda", variant: "secondary" },
  PREPARED: { label: "Produção Própria", variant: "default" },
};

import { UserRole } from "@prisma/client";

export const productTableColumns = (userRole: UserRole): ColumnDef<ProductDto>[] => [
  {
    accessorKey: "name",
    header: "Produto",
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row: { original: product } }) => {
      const config = PRODUCT_TYPE_LABELS[product.type] || PRODUCT_TYPE_LABELS.RESELL;
      return (
        <div className="flex items-center gap-2">
          <Badge variant={config.variant}>{config.label}</Badge>
          {!product.isActive && (
            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
              Inativo
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "price",
    header: "Valor unitário",
    cell: (row) => {
      const product = row.row.original;
      return Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(product.price));
    },
  },
  {
    accessorKey: "margin",
    header: "Margem",
    cell: (row) => {
      const product = row.row.original;
      return `${product.margin}%`;
    },
  },
  {
    accessorKey: "stock",
    header: "Estoque",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row: { original: product } }) => {
      return <ProductStatusBadge status={product.status} />;
    },
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: (row) => <ProductTableDropdownMenu product={row.row.original} userRole={userRole} />,
  },
];

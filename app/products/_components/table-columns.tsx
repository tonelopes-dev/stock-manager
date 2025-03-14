"use client";

import { Badge } from "@/app/_components/ui/badge";
import { Product } from "@/app/_lib/prisma";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/app/_utils/currency";

const statusLabels = {
  "in-stock": "Em estoque",
  "out-of-stock": "Sem estoque"
};

export const productsTableColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Produto",
  },
  {
    accessorKey: "price",
    header: "Valor Unitário",
    cell: (row) => {
      const price = row.getValue() as number;
      return formatCurrency(price);
    },
  },
  {
    accessorKey: "stock",
    header: "Estoque",
    cell: (row) => {
      const stock = row.getValue() as number;
      return stock === 1 ? `${stock} unidade` : `${stock} unidades`;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (row) => {
      const product = row.row.original;
      const label = statusLabels[product.status] || "Status desconhecido";
      return (
        <Badge
          className={`${product.status === "in-stock" ? "text-green-500 hover:text-green-600" : "text-red-500 hover:text-red-600"}`}
          variant="outline"
        >
          {label}
        </Badge>
      );
    },
  },
];

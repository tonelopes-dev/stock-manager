"use client";

import { Badge } from "@/app/_components/ui/badge";
import { Product } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

const getStatusLabel = (status: string) => {
  if (status === "in-stock") {
    return "Em estoque";
  }
  return "Sem estoque";
};

export const productsTableColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Produto",
  },
  {
    accessorKey: "price",
    header: "Valor Unitário",
  },
  {
    accessorKey: "stock",
    header: "Estoque",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (row) => {
      const product = row.row.original;
      const label = getStatusLabel(product.status);
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

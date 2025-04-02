"use client";

import { Badge } from "@/app/_components/ui/badge";
import { Product } from "@/app/_lib/prisma";
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/app/_utils/currency";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Button } from "@/app/_components/ui/button";
import {
  ClipboardCopyIcon,
  EditIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from "lucide-react";

const statusLabels = {
  "in-stock": "Em estoque",
  "out-of-stock": "Sem estoque",
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
  {
    accessorKey: "actions",
    header: "Ações",
    cell: (row) => {
      const product = row.row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <MoreHorizontalIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(product.id)}
            >
              <ClipboardCopyIcon className="mr-2 h-4 w-4" />
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuItem>
              <EditIcon className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <TrashIcon className="mr-2 h-4 w-4" />
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

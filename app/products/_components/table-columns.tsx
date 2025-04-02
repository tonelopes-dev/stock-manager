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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { Dialog } from "@/app/_components/ui/dialog";
import AlertDeleteDialog from "./delete-dialog";

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
        <AlertDialog>
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
              {/* DELETE BUTTON ACTION */}
              <AlertDialogTrigger asChild>
                <DropdownMenuItem>
                  <Button>
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* CONTENT BUTTON DIALOG DELETE */}
          <AlertDeleteDialog productId={product.id} />
        </AlertDialog>
      );
    },
  },
];

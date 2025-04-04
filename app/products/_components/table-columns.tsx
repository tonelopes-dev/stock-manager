"use client";

import { useState } from "react";
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
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { Dialog, DialogTrigger } from "@/app/_components/ui/dialog";
import AlertDeleteDialog from "./delete-dialog";
import UpsertProductDialogContent from "./upsert-dialog-content";


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
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [editDialogOpen, setEditDialogOpen] = useState(false);
      const product = row.row.original;
      return (
        <AlertDialog>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
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
                <DialogTrigger asChild>
                  <DropdownMenuItem>
                    <EditIcon className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                </DialogTrigger>
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
            {/* CONTENT BUTTON DIALOG DELETE and EDIT */}
            <UpsertProductDialogContent
              defaultValues={{
                id: product.id,
                name: product.name,
                price: Number(product.price),
                stock: product.stock,
              }}
              onSucess={() => setEditDialogOpen(false)}
            />
            <AlertDeleteDialog productId={product.id} />
          </Dialog>
        </AlertDialog>
      );
    },
  },
];

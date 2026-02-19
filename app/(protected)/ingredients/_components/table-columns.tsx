"use client";

import { ColumnDef } from "@tanstack/react-table";
import IngredientTableDropdownMenu from "./table-dropdown-menu";
import { IngredientDto } from "@/app/_data-access/ingredient/get-ingredients";
import { Badge } from "@/app/_components/ui/badge";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  IN_STOCK: { label: "Em estoque", variant: "default" },
  LOW_STOCK: { label: "Estoque baixo", variant: "secondary" },
  OUT_OF_STOCK: { label: "Sem estoque", variant: "destructive" },
};

export const ingredientTableColumns: ColumnDef<IngredientDto>[] = [
  {
    accessorKey: "name",
    header: "Insumo",
  },
  {
    accessorKey: "unitLabel",
    header: "Unidade",
  },
  {
    accessorKey: "stock",
    header: "Estoque",
    cell: ({ row: { original } }) => {
      return `${original.stock} ${original.unitLabel}`;
    },
  },
  {
    accessorKey: "minStock",
    header: "Estoque Mín.",
    cell: ({ row: { original } }) => {
      return `${original.minStock} ${original.unitLabel}`;
    },
  },
  {
    accessorKey: "cost",
    header: "Custo Unit.",
    cell: ({ row: { original } }) => {
      return Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(original.cost) + `/${original.unitLabel}`;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row: { original } }) => {
      const config = STATUS_LABELS[original.status];
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row: { original } }) => <IngredientTableDropdownMenu ingredient={original} />,
  },
];

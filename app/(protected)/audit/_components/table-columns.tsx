"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StockMovementDto } from "@/app/_data-access/stock-movement/get-stock-movements";
import { Badge } from "@/app/_components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  SALE: { label: "Venda", variant: "default" },
  ADJUSTMENT: { label: "Ajuste", variant: "outline" },
  MANUAL: { label: "Manual", variant: "outline" },
  PRODUCTION: { label: "Produção", variant: "secondary" },
  CANCEL: { label: "Cancelamento", variant: "destructive" },
};

export const stockMovementTableColumns: ColumnDef<StockMovementDto>[] = [
  {
    accessorKey: "createdAt",
    header: "Data",
    cell: ({ row: { original: movement } }) =>
      format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
  },
  {
    header: "Item",
    cell: ({ row: { original: movement } }) => {
      if (movement.product) {
        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Produto</span>
            <span>{movement.product.name}</span>
          </div>
        );
      }
      if (movement.ingredient) {
        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Insumo</span>
            <span>{movement.ingredient.name}</span>
          </div>
        );
      }
      return "-";
    },
  },
  {
    accessorKey: "type",
    header: "Operação",
    cell: ({ row: { original: movement } }) => {
      const config = typeMap[movement.type] || { label: movement.type, variant: "outline" };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    header: "Qtd.",
    cell: ({ row: { original: movement } }) => {
      const isNegative = movement.quantity < 0;
      return (
        <span className={`font-bold ${isNegative ? "text-destructive" : "text-primary"}`}>
          {isNegative ? "" : "+"}{movement.quantity}
        </span>
      );
    },
  },
  {
    header: "Saldo (Antes/Depois)",
    cell: ({ row: { original: movement } }) => (
      <span className="text-muted-foreground">
        {movement.stockBefore} → <span className="text-foreground font-medium">{movement.stockAfter}</span>
      </span>
    ),
  },
  {
    header: "Usuário",
    cell: ({ row: { original: movement } }) => (
      <div className="flex flex-col">
        <span className="font-medium">{movement.user.name || "N/A"}</span>
        <span className="text-xs text-muted-foreground">{movement.user.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "reason",
    header: "Motivo/Justificativa",
    cell: ({ row: { original: movement } }) => (
      <span className="text-sm italic text-muted-foreground">
        {movement.reason || "-"}
      </span>
    ),
  },
];

"use client";

import { TrashIcon, ShoppingCartIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { QuantityStepper } from "@/app/_components/ui/quantity-stepper";
import { formatCurrency } from "@/app/_helpers/currency";

interface CartTableProps {
  fields: any[];
  remove: (index: number) => void;
  update: (index: number, item: any) => void;
  isReadOnly?: boolean;
}

export const CartTable = ({ 
  fields, 
  remove, 
  update,
  isReadOnly = false,
}: CartTableProps) => {
  const handleUpdateQuantity = (index: number, quantity: number) => {
    const item = fields[index];
    update(index, { ...item, quantity });
  };

  if (fields.length === 0) {
    return (
      <div className="mt-2 flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 text-muted-foreground">
        <ShoppingCartIcon size={32} className="mb-3 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest opacity-50">
          Carrinho Vazio
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="h-8 px-2 text-[9px] font-black uppercase text-muted-foreground">
              Produto
            </TableHead>
            <TableHead className="h-8 px-2 text-[9px] font-black uppercase text-muted-foreground">
              Qtd
            </TableHead>
            <TableHead className="h-8 px-2 text-right text-[9px] font-black uppercase text-muted-foreground">
              Unit.
            </TableHead>
            <TableHead className="h-8 px-2 text-right text-[9px] font-black uppercase text-muted-foreground">
              Total
            </TableHead>
            {!isReadOnly && <TableHead className="h-8 w-8 text-center text-[9px] font-black uppercase text-muted-foreground"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => (
            <TableRow key={field.id || field.productId} className="group border-border">
              <TableCell className="px-2 py-2">
                <p className="max-w-[120px] truncate text-xs font-bold text-foreground">
                  {field.name}
                </p>
              </TableCell>
              <TableCell className="px-2 py-2">
                <QuantityStepper
                  value={field.quantity}
                  onChange={(val) => handleUpdateQuantity(index, val)}
                  max={field.stock}
                  className="h-7 w-20"
                  disabled={isReadOnly}
                />
              </TableCell>
              <TableCell className="px-2 py-2 text-right text-[11px] font-medium text-muted-foreground">
                {formatCurrency(field.price)}
              </TableCell>
              <TableCell className="px-2 py-2 text-right text-[11px] font-black text-foreground">
                {formatCurrency(field.price * field.quantity)}
              </TableCell>
              {!isReadOnly && (
                <TableCell className="px-2 py-2 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    data-testid="remove-item-button"
                    onClick={() => remove(index)}
                    className="h-8 w-8 rounded-lg text-rose-500 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                  >
                    <TrashIcon size={16} />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

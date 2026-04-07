"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
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

export const CartTable = () => {
  const { control } = useFormContext();
  const { fields, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const item = fields[index] as any;
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
    <div className="mt-2 rounded-2xl border border-border bg-background shadow-sm">
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
            <TableHead className="h-8 w-8 text-center text-[9px] font-black uppercase text-muted-foreground"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((item: any, index) => (
            <TableRow key={item.id} className="group border-border">
              <TableCell className="px-2 py-2">
                <p className="max-w-[120px] truncate text-xs font-bold text-foreground">
                  {item.name}
                </p>
              </TableCell>
              <TableCell className="px-2 py-2">
                <QuantityStepper
                  value={item.quantity}
                  onChange={(val) => handleUpdateQuantity(index, val)}
                  max={item.stock}
                  className="h-7 w-20"
                />
              </TableCell>
              <TableCell className="px-2 py-2 text-right text-[11px] font-medium text-muted-foreground">
                {formatCurrency(item.price)}
              </TableCell>
              <TableCell className="px-2 py-2 text-right text-[11px] font-black text-foreground">
                {formatCurrency(item.price * item.quantity)}
              </TableCell>
              <TableCell className="px-2 py-2 text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => remove(index)}
                  className="h-8 w-8 rounded-lg text-rose-500 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                >
                  <TrashIcon size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

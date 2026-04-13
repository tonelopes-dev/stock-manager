"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NumericFormat, NumberFormatValues } from "react-number-format";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { useAction } from "next-safe-action/hooks";
import { createStockEntry } from "@/app/_actions/stock-entry/create-stock-entry";
import { createStockEntrySchema, CreateStockEntrySchema } from "@/app/_actions/stock-entry/create-stock-entry/schema";
import { toast } from "sonner";
import { Supplier, Product } from "@prisma/client";
import { Combobox } from "@/app/_components/ui/combobox";
import { DatePicker } from "@/app/_components/ui/date-picker";

interface CreateStockEntryDialogContentProps {
  setSheetIsOpen: (isOpen: boolean) => void;
  suppliers: Supplier[];
  products: Product[];
}

const CreateStockEntryDialogContent = ({
  setSheetIsOpen,
  suppliers,
  products,
}: CreateStockEntryDialogContentProps) => {
  const form = useForm<CreateStockEntrySchema>({
    resolver: zodResolver(createStockEntrySchema),
    defaultValues: {
      productId: "",
      supplierId: "",
      quantity: 0,
      unitCost: 0,
      batchNumber: "",
      invoiceNumber: "",
    },
  });

  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    // Small delay to ensure Radix/Next hydration is settled
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { execute, isExecuting } = useAction(createStockEntry, {
    onSuccess: () => {
      toast.success("Compra registrada e estoque atualizado!");
      setSheetIsOpen(false);
      form.reset();
    },
    onError: () => {
      toast.error("Erro ao registrar compra.");
    },
  });

  const onSubmit = (data: CreateStockEntrySchema) => {
    execute(data);
  };

  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const selectedProduct = products.find((p) => p.id === form.watch("productId"));
  const unitLabel = selectedProduct?.unit || "";

  return (
    <DialogContent data-testid="upsert-stock-entry-dialog" data-ready={isReady} className="sm:max-w-[700px] rounded-3xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
          Registrar Compra / Entrada
        </DialogTitle>
        <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
          Abata a nota fiscal e atualize o estoque de seus insumos.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground mr-1">Insumo / Produto</FormLabel>
                  <FormControl>
                    <Combobox
                      options={productOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione o insumo..."
                      data-testid="stock-entry-product-combobox"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground mr-1">Fornecedor</FormLabel>
                  <FormControl>
                    <Combobox
                      options={supplierOptions}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Selecione o fornecedor..."
                      data-testid="stock-entry-supplier-combobox"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="stock-entry-quantity-input" className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground mr-1">Quantidade</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <NumericFormat
                        id="stock-entry-quantity-input"
                        aria-label="Quantidade da Compra"
                        className="h-10 rounded-xl pr-12"
                        customInput={Input}
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={unitLabel === "UN" ? 0 : 3}
                        fixedDecimalScale={false}
                        value={field.value === 0 ? "" : field.value}
                        onValueChange={(values: NumberFormatValues) => field.onChange(values.floatValue ?? 0)}
                        placeholder={unitLabel === "UN" ? "0" : "0,000"}
                      />
                      {unitLabel && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                          {unitLabel}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="stock-entry-cost-input" className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground mr-1">Custo Unitário (R$)</FormLabel>
                  <FormControl>
                    <NumericFormat
                      id="stock-entry-cost-input"
                      aria-label="Custo Unitário"
                      className="h-10 rounded-xl"
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      fixedDecimalScale={true}
                      prefix="R$ "
                      value={field.value === 0 ? "" : field.value}
                      onValueChange={(values: NumberFormatValues) => field.onChange(values.floatValue ?? 0)}
                      placeholder="R$ 0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground mr-1">Número da Nota Fiscal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: NF-12345" className="h-10 rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground mr-1">Lote</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: LOTE-A1" className="h-10 rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground mr-1">Data de Validade</FormLabel>
                  <FormControl>
                    <DatePicker 
                      value={field.value} 
                      onChange={field.onChange} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetIsOpen(false)}
              disabled={isExecuting}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button 
                type="submit" 
                disabled={isExecuting}
                className="rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
            >
              {isExecuting ? "Processando..." : "Confirmar Entrada"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default CreateStockEntryDialogContent;

"use client";

import { Button } from "@/app/_components/ui/button";
import { Combobox, ComboboxOption } from "@/app/_components/ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/_components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { formatCurrency } from "@/app/_helpers/currency";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, PlusIcon, TrashIcon, ShoppingCartIcon, CalendarIcon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { upsertSale } from "@/app/_actions/sale/upsert-sale";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { flattenValidationErrors } from "next-safe-action";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { QuantityStepper } from "@/app/_components/ui/quantity-stepper";

const formSchema = z.object({
  productId: z.string().uuid({
    message: "O produto é obrigatório.",
  }),
  quantity: z.coerce.number().int().positive(),
});

type FormSchema = z.infer<typeof formSchema>;

interface SelectedProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface UpsertSheetContentProps {
  isOpen: boolean;
  saleId?: string;
  saleDate?: Date;
  products: ProductDto[];
  productOptions: ComboboxOption[];
  setSheetIsOpen: Dispatch<SetStateAction<boolean>>;
  defaultSelectedProducts?: SelectedProduct[];
}

const UpsertSheetContent = ({
  isOpen,
  saleId,
  saleDate,
  products,
  productOptions,
  setSheetIsOpen,
  defaultSelectedProducts,
}: UpsertSheetContentProps) => {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    defaultSelectedProducts ?? [],
  );
  const [date, setDate] = useState<string>(
    saleDate ? new Date(saleDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );

  const { execute: executeUpsertSale, isPending } = useAction(upsertSale, {
    onError: ({ error: { validationErrors, serverError } }) => {
      const flattenedErrors = flattenValidationErrors(validationErrors);
      toast.error(serverError ?? flattenedErrors.formErrors[0]);
    },
    onSuccess: () => {
      toast.success(saleId ? "Venda atualizada com sucesso." : "Venda realizada com sucesso.");
      setSheetIsOpen(false);
    },
  });

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
    },
  });

  const selectedProductId = form.watch("productId");
  const selectedQuantity = form.watch("quantity");

  const currentProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  useEffect(() => {
    if (isOpen) {
      setSelectedProducts(defaultSelectedProducts ?? []);
      setDate(saleDate ? new Date(saleDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    } else {
      form.reset();
      setSelectedProducts([]);
    }
  }, [form, isOpen, defaultSelectedProducts, saleDate]);

  const onSubmit = (data: FormSchema) => {
    const product = products.find((p) => p.id === data.productId);
    if (!product) return;

    setSelectedProducts((current) => {
      const existing = current.find((p) => p.id === product.id);
      if (existing) {
        if (existing.quantity + data.quantity > product.stock) {
          form.setError("quantity", { message: "Estoque insuficiente." });
          return current;
        }
        return current.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + data.quantity } : p
        );
      }
      if (data.quantity > product.stock) {
        form.setError("quantity", { message: "Estoque insuficiente." });
        return current;
      }
      return [...current, { ...product, price: Number(product.price), quantity: data.quantity }];
    });
    form.reset({ productId: "", quantity: 1 });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity > product.stock) {
      toast.error(`Apenas ${product.stock} unidades disponíveis.`);
      return;
    }

    setSelectedProducts(current =>
      current.map(p => p.id === productId ? { ...p, quantity: newQuantity } : p)
    );
  };

  const onDelete = (productId: string) => {
    setSelectedProducts(current => current.filter(p => p.id !== productId));
  };

  const totals = useMemo(() => {
    const subtotal = selectedProducts.reduce((acc, p) => acc + p.price * p.quantity, 0);
    const itenCount = selectedProducts.reduce((acc, p) => acc + p.quantity, 0);
    return { subtotal, itenCount };
  }, [selectedProducts]);

  const onSubmitSale = () => {
    executeUpsertSale({
      id: saleId,
      date: date ? new Date(date) : undefined,
      products: selectedProducts.map((p) => ({ id: p.id, quantity: p.quantity })),
    });
  };

  return (
    <SheetContent className="flex flex-col h-full !max-w-[700px] p-0 border-none">
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                <ShoppingCartIcon size={18} />
              </div>
              <SheetTitle className="text-xl font-black italic tracking-tighter uppercase whitespace-nowrap">
                {saleId ? "Editar Venda" : "Nova Venda"}
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs font-semibold text-slate-400 uppercase tracking-tight">
              Venda rápida • Atualização em tempo real
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30">
          {/* Product Composition Area */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900">Compor Carrinho</h4>
                <p className="text-[10px] font-medium text-slate-400 uppercase">Adicione produtos e quantidades</p>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                  <CalendarIcon size={12} />
                  Data
                </Label>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 w-[130px] text-[10px] font-bold border-slate-200 focus-visible:ring-primary/20 p-2"
                />
              </div>
            </div>

            <Form {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-7">
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400">Produto</FormLabel>
                        <FormControl>
                          <Combobox
                            placeholder="Buscar produto..."
                            options={productOptions}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem className="md:col-span-5">
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400">Quantidade</FormLabel>
                        <FormControl>
                          <QuantityStepper 
                            value={field.value} 
                            onChange={field.onChange} 
                            max={currentProduct?.stock}
                            className="h-10 justify-start"
                          />
                        </FormControl>
                        {currentProduct && (
                          <p className="text-[10px] font-bold text-slate-400 mt-1.5">
                            Estoque: <span className="text-slate-900">{currentProduct.stock} unid.</span>
                          </p>
                        )}
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {currentProduct && (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Resumo Parcial</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-slate-900">
                          {formatCurrency(Number(currentProduct.price) * selectedQuantity)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          ({selectedQuantity}x {formatCurrency(Number(currentProduct.price))})
                        </span>
                      </div>
                    </div>
                    <Button type="submit" className="gap-2 h-10 font-bold" variant="default">
                      <PlusIcon size={18} />
                      Adicionar à Lista
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </div>

          {/* Added Products Table */}
          <div className="space-y-4 pb-32">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tighter italic">Itens da Venda</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{selectedProducts.length} produtos adicionados</p>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-slate-400">
                <ShoppingCartIcon size={24} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">Carrinho Vazio</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 h-10">Produto</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 h-10">Qtd</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 h-10 text-right">Unitário</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 h-10 text-right">Total</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 h-10 text-center w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProducts.map((p) => (
                      <TableRow key={p.id} className="border-slate-100 group">
                        <TableCell className="py-4">
                          <p className="text-sm font-bold text-slate-900">{p.name}</p>
                        </TableCell>
                        <TableCell className="py-4">
                          <QuantityStepper 
                            value={p.quantity} 
                            onChange={(val) => updateQuantity(p.id, val)} 
                            max={p.stock}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right py-4 font-medium text-slate-600">
                          {formatCurrency(p.price)}
                        </TableCell>
                        <TableCell className="text-right py-4 font-black text-slate-900">
                          {formatCurrency(p.price * p.quantity)}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onDelete(p.id)}
                            className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <TrashIcon size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Summary Footer */}
        <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter italic">Resumo Financeiro</p>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-tighter">{totals.itenCount} itens no total</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter italic">Total Geral</p>
              <h2 className="text-3xl font-black text-primary tracking-tighter leading-none">
                {formatCurrency(totals.subtotal)}
              </h2>
            </div>
          </div>

          <Button
            className="w-full h-12 text-sm font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            disabled={selectedProducts.length === 0 || isPending}
            onClick={onSubmitSale}
          >
            {isPending ? (
              <span className="animate-pulse">Processando...</span>
            ) : (
              <>
                <CheckIcon size={18} />
                {saleId ? "Salvar Alterações" : "Finalizar Venda"}
              </>
            )}
          </Button>
        </div>
      </div>
    </SheetContent>
  );
};

export default UpsertSheetContent;

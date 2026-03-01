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
import { format } from "date-fns";
import {
  ShoppingCartIcon,
  CalendarIcon,
  UsersIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
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
  customerOptions: ComboboxOption[];
  setSheetIsOpen: Dispatch<SetStateAction<boolean>>;
  defaultSelectedProducts?: SelectedProduct[];
  customerId?: string | null;
  hasSales?: boolean;
}

const UpsertSheetContent = ({
  isOpen,
  saleId,
  saleDate,
  customerId: defaultCustomerId,
  products,
  productOptions,
  customerOptions,
  setSheetIsOpen,
  defaultSelectedProducts,
}: UpsertSheetContentProps) => {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    defaultSelectedProducts ?? [],
  );
  const [date, setDate] = useState<string>(
    saleDate
      ? format(new Date(saleDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
  );
  const [customerId, setCustomerId] = useState<string | undefined>(
    defaultCustomerId || undefined,
  );

  const { execute: executeUpsertSale, isPending } = useAction(upsertSale, {
    onError: ({ error: { validationErrors, serverError } }) => {
      const flattenedErrors = flattenValidationErrors(validationErrors);
      toast.error(serverError ?? flattenedErrors.formErrors[0]);
    },
    onSuccess: () => {
      toast.success("Venda realizada com sucesso.");
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
    return products.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  useEffect(() => {
    if (isOpen) {
      setSelectedProducts(defaultSelectedProducts ?? []);
      setDate(
        saleDate
          ? format(new Date(saleDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
      );
      setCustomerId(defaultCustomerId || undefined);
    } else {
      form.reset();
      setSelectedProducts([]);
      setCustomerId(undefined);
    }
  }, [form, isOpen, defaultSelectedProducts, saleDate, defaultCustomerId]);

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
          p.id === product.id
            ? { ...p, quantity: p.quantity + data.quantity }
            : p,
        );
      }
      if (data.quantity > product.stock) {
        form.setError("quantity", { message: "Estoque insuficiente." });
        return current;
      }
      return [
        ...current,
        { ...product, price: Number(product.price), quantity: data.quantity },
      ];
    });
    form.reset({ productId: "", quantity: 1 });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (newQuantity > product.stock) {
      toast.error(`Apenas ${product.stock} unidades disponíveis.`);
      return;
    }

    setSelectedProducts((current) =>
      current.map((p) =>
        p.id === productId ? { ...p, quantity: newQuantity } : p,
      ),
    );
  };

  const onDelete = (productId: string) => {
    setSelectedProducts((current) => current.filter((p) => p.id !== productId));
  };

  const totals = useMemo(() => {
    const subtotal = selectedProducts.reduce(
      (acc, p) => acc + p.price * p.quantity,
      0,
    );
    const itenCount = selectedProducts.reduce((acc, p) => acc + p.quantity, 0);
    return { subtotal, itenCount };
  }, [selectedProducts]);

  const onSubmitSale = () => {
    executeUpsertSale({
      id: saleId,
      date: date ? new Date(date + "T12:00:00") : undefined,
      customerId,
      products: selectedProducts.map((p) => ({
        id: p.id,
        quantity: p.quantity,
      })),
    });
  };

  return (
    <SheetContent className="flex h-full !max-w-[700px] flex-col border-none p-0">
      <div className="flex h-full flex-col">
        {/* Header Section */}
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-6">
          <SheetHeader className="text-left">
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                <ShoppingCartIcon size={18} />
              </div>
              <SheetTitle className="whitespace-nowrap text-xl font-black uppercase italic tracking-tighter">
                {saleId ? "Editar Venda" : "Nova Venda"}
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs font-semibold uppercase tracking-tight text-slate-400">
              Venda rápida • Atualização em tempo real
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-8 overflow-y-auto bg-slate-50/30 p-6">
          {/* Product Composition Area */}
          <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900">
                  Compor Carrinho
                </h4>
                <p className="text-[10px] font-medium uppercase text-slate-400">
                  Adicione produtos e quantidades
                </p>
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400">
                  <CalendarIcon size={12} />
                  Data
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 w-[130px] border-slate-200 p-2 text-[10px] font-bold focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400">
                  <UsersIcon size={12} className="text-secondary" />
                  Cliente
                </Label>
                <Combobox
                  options={customerOptions}
                  value={customerId || ""}
                  onChange={(val) => setCustomerId(val || undefined)}
                  placeholder="Selecione o Cliente..."
                />
              </div>
            </div>

            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-7">
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400">
                          Produto
                        </FormLabel>
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
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400">
                          Quantidade
                        </FormLabel>
                        <FormControl>
                          <QuantityStepper
                            value={field.value}
                            onChange={field.onChange}
                            max={currentProduct?.stock}
                            className="h-10 justify-start"
                          />
                        </FormControl>
                        {currentProduct && (
                          <p className="mt-1.5 text-[10px] font-bold text-slate-400">
                            Estoque:{" "}
                            <span className="text-slate-900">
                              {currentProduct.stock} unid.
                            </span>
                          </p>
                        )}
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {currentProduct && (
                  <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all animate-in fade-in slide-in-from-top-2 md:flex-row md:items-center">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                        Resumo Parcial
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-slate-900">
                          {formatCurrency(
                            Number(currentProduct.price) * selectedQuantity,
                          )}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          ({selectedQuantity}x{" "}
                          {formatCurrency(Number(currentProduct.price))})
                        </span>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="h-10 gap-2 font-bold"
                      variant="default"
                    >
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
              <h4 className="text-sm font-bold uppercase italic tracking-tighter text-slate-900">
                Itens da Venda
              </h4>
              <p className="text-[10px] font-bold uppercase text-slate-400">
                {selectedProducts.length} produtos adicionados
              </p>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 text-slate-400">
                <ShoppingCartIcon size={24} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">
                  Carrinho Vazio
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400">
                        Produto
                      </TableHead>
                      <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400">
                        Qtd
                      </TableHead>
                      <TableHead className="h-10 text-right text-[10px] font-black uppercase text-slate-400">
                        Unitário
                      </TableHead>
                      <TableHead className="h-10 text-right text-[10px] font-black uppercase text-slate-400">
                        Total
                      </TableHead>
                      <TableHead className="h-10 w-10 text-center text-[10px] font-black uppercase text-slate-400"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProducts.map((p) => (
                      <TableRow key={p.id} className="group border-slate-100">
                        <TableCell className="py-4">
                          <p className="text-sm font-bold text-slate-900">
                            {p.name}
                          </p>
                        </TableCell>
                        <TableCell className="py-4">
                          <QuantityStepper
                            value={p.quantity}
                            onChange={(val) => updateQuantity(p.id, val)}
                            max={p.stock}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="py-4 text-right font-medium text-slate-600">
                          {formatCurrency(p.price)}
                        </TableCell>
                        <TableCell className="py-4 text-right font-black text-slate-900">
                          {formatCurrency(p.price * p.quantity)}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(p.id)}
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
            )}
          </div>
        </div>

        {/* Sticky Summary Footer */}
        <div className="sticky bottom-0 z-10 border-t border-slate-100 bg-white p-6 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-all">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase italic tracking-tighter text-slate-400">
                Resumo Financeiro
              </p>
              <p className="text-xs font-bold uppercase tracking-tighter text-slate-900">
                {totals.itenCount} itens no total
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase italic tracking-tighter text-slate-400">
                Total Geral
              </p>
              <h2 className="text-3xl font-black leading-none tracking-tighter text-primary">
                {formatCurrency(totals.subtotal)}
              </h2>
            </div>
          </div>

          <Button
            className="h-12 w-full gap-2 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
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

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
  AlertTriangle,
  CreditCardIcon,
  WalletIcon,
  SmartphoneIcon,
  BanknoteIcon,
  PlusIcon,
  CalendarIcon,
  UsersIcon,
  TrashIcon,
  ShoppingCartIcon,
  CheckIcon,
} from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import { upsertSale } from "@/app/_actions/sale/upsert-sale";
import { createOrderAction } from "@/app/_actions/order/create-order";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { flattenValidationErrors } from "next-safe-action";
import { cn } from "@/app/_lib/utils";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { QuantityStepper } from "@/app/_components/ui/quantity-stepper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { parseISO } from "date-fns";
import { Switch } from "@/app/_components/ui/switch";

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
  paymentMethod?: PaymentMethod | null;
  tipAmount?: number | null;
  hasSales?: boolean;
  companyId: string;
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
  paymentMethod: defaultPaymentMethod,
  tipAmount: defaultTipAmount,
  companyId,
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(
    (defaultPaymentMethod as PaymentMethod) || undefined,
  );
  const [applyServiceCharge, setApplyServiceCharge] = useState<boolean>(true);

  const { execute: executeUpsertSale, isPending: isUpsertPending } = useAction(
    upsertSale,
    {
      onError: ({ error: { validationErrors, serverError } }) => {
        const flattenedErrors = flattenValidationErrors(validationErrors);
        toast.error(serverError ?? flattenedErrors.formErrors[0]);
      },
      onSuccess: () => {
        toast.success("Venda realizada com sucesso.");
        setSheetIsOpen(false);
      },
    },
  );

  const { execute: executeCreateOrder, isPending: isOrderPending } = useAction(
    createOrderAction,
    {
      onError: ({ error: { serverError } }) => {
        toast.error(serverError || "Erro ao criar comanda.");
      },
      onSuccess: () => {
        toast.success("Comanda (Pedido) criada com sucesso! 📝");
        setSheetIsOpen(false);
      },
    },
  );

  const isPending = isUpsertPending || isOrderPending;

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
      setPaymentMethod((defaultPaymentMethod as PaymentMethod) || undefined);
      setApplyServiceCharge(defaultTipAmount === undefined ? true : Number(defaultTipAmount) > 0);
    } else {
      form.reset();
      setSelectedProducts([]);
      setCustomerId(undefined);
      setPaymentMethod(undefined);
      setApplyServiceCharge(true);
    }
  }, [
    form,
    isOpen,
    defaultSelectedProducts,
    saleDate,
    defaultCustomerId,
    defaultPaymentMethod,
    defaultTipAmount,
  ]);

  const onSubmit = (data: FormSchema) => {
    const product = products.find((p) => p.id === data.productId);
    if (!product) return;

    setSelectedProducts((current) => {
      const existing = current.find((p) => p.id === product.id);
      if (existing) {
        return current.map((p) =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + data.quantity }
            : p,
        );
      }
      return [
        ...current,
        {
          ...product,
          price: Number(product.price),
          cost: Number(product.cost),
          stock: Number(product.stock),
          quantity: data.quantity,
        },
      ];
    });
    form.reset({ productId: "", quantity: 1 });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

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
    
    // Calculate 10% with 2 decimal precision
    const serviceChargeAmount = applyServiceCharge 
      ? Math.round(subtotal * 0.1 * 100) / 100 
      : 0;

    const totalWithTip = Math.round((subtotal + serviceChargeAmount) * 100) / 100;
    
    return { subtotal, itenCount, serviceChargeAmount, totalWithTip };
  }, [selectedProducts, applyServiceCharge]);

  const onSubmitSale = () => {
    if (selectedProducts.length === 0) return;

    if (!paymentMethod) {
      // Automatic Comanda Flow
      if (!customerId) {
        toast.error(
          "Para abrir uma comanda (sem pagamento imediato), você deve selecionar um cliente.",
        );
        return;
      }

      executeCreateOrder({
        companyId,
        customerId,
        items: selectedProducts.map((p) => ({
          productId: p.id,
          quantity: p.quantity,
        })),
        notes: "Criado via Painel de Gestão",
      });
    } else {
      // Regular Sale Flow
      executeUpsertSale({
        id: saleId,
        date: date ? new Date(date + "T12:00:00") : undefined,
        customerId,
        paymentMethod,
        tipAmount: totals.serviceChargeAmount,
        products: selectedProducts.map((p) => ({
          id: p.id,
          quantity: p.quantity,
        })),
      });
    }
  };
  return (
    <SheetContent className="flex h-full !max-w-[700px] flex-col border-none p-0">
      <div className="flex h-full flex-col">
        {/* Header Section */}
        <div className="sticky top-0 z-10 border-b border-border bg-background p-6">
          <SheetHeader className="text-left">
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                <ShoppingCartIcon size={18} />
              </div>
              <SheetTitle className="whitespace-nowrap text-xl font-black uppercase italic tracking-tighter">
                {saleId ? "Editar Venda" : "Nova Venda"}
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">
              Venda rápida • Atualização em tempo real
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-8 overflow-y-auto bg-muted/30 p-6">
          {/* Sale Metadata Section */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-background p-6 shadow-sm">
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground">
                <CalendarIcon size={12} />
                Data da Venda
              </Label>
              <DatePicker
                value={date ? parseISO(date) : undefined}
                onChange={(newDate) =>
                  setDate(newDate ? format(newDate, "yyyy-MM-dd") : "")
                }
                className="h-10 w-full border-border text-xs font-bold"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground">
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

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setCustomerId(undefined)}
                  className={cn(
                    "h-8 px-3 text-[10px] font-black uppercase tracking-widest transition-all",
                    !customerId
                      ? "border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {!customerId ? (
                    <span className="flex items-center gap-1.5">
                      <CheckIcon size={12} /> Venda Avulsa Ativada
                    </span>
                  ) : (
                    "Ativar Venda Avulsa"
                  )}
                </Button>

                {customerId && (
                   <p className="text-[9px] font-bold uppercase text-muted-foreground italic">
                      Cliente selecionado
                   </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Composition Area */}
          <div className="space-y-6 rounded-2xl border border-border bg-background p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-foreground">
                  Compor Carrinho
                </h4>
                <p className="text-[10px] font-medium uppercase text-muted-foreground">
                  Adicione produtos e quantidades
                </p>
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
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">
                          Produto
                        </FormLabel>
                        <FormControl>
                          <Combobox
                            placeholder="Buscar produto..."
                            options={productOptions}
                            data-testid="product-search-combobox"
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
                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">
                          Quantidade
                        </FormLabel>
                        <FormControl>
                          <QuantityStepper
                            value={field.value}
                            onChange={field.onChange}
                            className="h-10 justify-start"
                          />
                        </FormControl>
                        {currentProduct && (
                          <p className="mt-1.5 text-[10px] font-bold text-muted-foreground">
                            Estoque:{" "}
                            <span className="text-foreground">
                              {Number(currentProduct.stock)} unid.
                            </span>
                          </p>
                        )}
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {currentProduct && (
                  <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-muted p-4 transition-all animate-in fade-in slide-in-from-top-2 md:flex-row md:items-center">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                        Resumo Parcial
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-foreground">
                          {formatCurrency(
                            Number(currentProduct.price) * selectedQuantity,
                          )}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
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
              <h4 className="text-sm font-bold uppercase italic tracking-tighter text-foreground">
                Itens da Venda
              </h4>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                {selectedProducts.length} produtos adicionados
              </p>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/50 text-muted-foreground">
                <ShoppingCartIcon size={24} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">
                  Carrinho Vazio
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="h-10 text-[10px] font-black uppercase text-muted-foreground">
                        Produto
                      </TableHead>
                      <TableHead className="h-10 text-[10px] font-black uppercase text-muted-foreground">
                        Qtd
                      </TableHead>
                      <TableHead className="h-10 text-right text-[10px] font-black uppercase text-muted-foreground">
                        Unitário
                      </TableHead>
                      <TableHead className="h-10 text-right text-[10px] font-black uppercase text-muted-foreground">
                        Total
                      </TableHead>
                      <TableHead className="h-10 w-10 text-center text-[10px] font-black uppercase text-muted-foreground"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProducts.map((p) => (
                      <TableRow key={p.id} className="group border-border">
                        <TableCell className="py-4">
                          <p className="text-sm font-bold text-foreground">
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
                        <TableCell className="py-4 text-right font-medium text-muted-foreground">
                          {formatCurrency(p.price)}
                        </TableCell>
                        <TableCell className="py-4 text-right font-black text-foreground">
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
        <div className="sticky bottom-0 z-10 border-t border-border bg-background p-6 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-all">
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                Resumo Financeiro
              </p>
              <p className="text-xs font-bold uppercase tracking-tighter text-foreground">
                {totals.itenCount} itens no total
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                Total Geral
              </p>
              <h2 className="text-3xl font-black leading-none tracking-tighter text-primary">
                {formatCurrency(totals.totalWithTip)}
              </h2>
            </div>
          </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                  Taxa de Serviço (10%)
                </Label>
                <div className="flex h-12 items-center justify-between rounded-xl border border-border bg-muted/50 px-4">
                   <div className="flex items-center gap-3">
                      <Switch 
                        checked={applyServiceCharge}
                        onCheckedChange={setApplyServiceCharge}
                        id="service-charge"
                      />
                      <Label htmlFor="service-charge" className="text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                         {applyServiceCharge ? "Ativada" : "Desativada"}
                      </Label>
                   </div>
                   <span className={cn(
                      "text-sm font-black transition-colors",
                      applyServiceCharge ? "text-primary" : "text-muted-foreground/50"
                   )}>
                      {formatCurrency(totals.serviceChargeAmount)}
                   </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                  Forma de Pagamento
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                >
                  <SelectTrigger 
                    className="h-12 border-border font-bold focus:ring-primary/20"
                    aria-label="Forma de Pagamento"
                    data-testid="payment-method-select"
                  >
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="border-border">
                    <SelectItem value="CASH" className="font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <BanknoteIcon size={16} className="text-emerald-500" />
                        Dinheiro
                      </div>
                    </SelectItem>
                    <SelectItem value="PIX" className="font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <SmartphoneIcon size={16} className="text-cyan-500" />
                        PIX
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="CREDIT_CARD"
                      className="font-bold text-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCardIcon size={16} className="text-primary" />
                        Crédito
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="DEBIT_CARD"
                      className="font-bold text-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <WalletIcon size={16} className="text-primary" />
                        Débito
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="OTHER"
                      className="font-bold text-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <WalletIcon size={16} className="text-muted-foreground" />
                        Outro
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          <Button
            className="mt-6 h-12 w-full gap-2 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            data-testid="finalize-sale-button"
            disabled={selectedProducts.length === 0 || isPending}
            onClick={onSubmitSale}
          >
            {isPending ? (
              <span className="animate-pulse">Processando...</span>
            ) : (
              <>
                <CheckIcon size={18} />
                {!paymentMethod
                  ? "Abrir Comanda"
                  : saleId
                    ? "Salvar Alterações"
                    : "Finalizar Venda"}
              </>
            )}
          </Button>
        </div>
      </div>
    </SheetContent>
  );
};

export default UpsertSheetContent;

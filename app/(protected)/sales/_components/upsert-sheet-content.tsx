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
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import UpsertCustomerDialogContent from "../../customers/_components/upsert-dialog-content";

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
  cost: number;
  operationalCost: number;
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
  defaultDiscountAmount?: number;
  defaultExtraAmount?: number;
  defaultAdjustmentReason?: string;
  defaultIsEmployeeSale?: boolean;
  hasSales?: boolean;
  companyId: string;
  stages: { id: string; name: string }[];
  categories: { id: string; name: string }[];
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
  defaultDiscountAmount = 0,
  defaultExtraAmount = 0,
  defaultAdjustmentReason = "",
  defaultIsEmployeeSale = false,
  companyId,
  stages,
  categories,
}: UpsertSheetContentProps) => {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    defaultSelectedProducts ?? [],
  );
  const [customerId, setCustomerId] = useState<string | undefined>(
    defaultCustomerId || undefined,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(
    (defaultPaymentMethod as PaymentMethod) || undefined,
  );
  const [date, setDate] = useState<string>(
    saleDate
      ? format(new Date(saleDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
  );
  const [applyServiceCharge, setApplyServiceCharge] = useState<boolean>(true);
  const [discountAmount, setDiscountAmount] = useState<number>(defaultDiscountAmount);
  const [extraAmount, setExtraAmount] = useState<number>(defaultExtraAmount);
  const [adjustmentReason, setAdjustmentReason] = useState<string>(defaultAdjustmentReason);
  const [adjustmentType, setAdjustmentType] = useState<"discount" | "extra">(
    defaultExtraAmount > 0 ? "extra" : "discount"
  );
  const [isEmployeeSale, setIsEmployeeSale] = useState<boolean>(defaultIsEmployeeSale);
  
  // Quick Customer State
  const [customerSearchValue, setCustomerSearchValue] = useState("");
  const [localCustomerOptions, setLocalCustomerOptions] = useState<ComboboxOption[]>(customerOptions);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // Sync local options with parent options
  useEffect(() => {
    setLocalCustomerOptions(customerOptions);
  }, [customerOptions]);

  const { execute: executeUpsertSale, isPending: isUpsertPending, reset: resetUpsertSale } = useAction(
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

  const { execute: executeCreateOrder, isPending: isOrderPending, reset: resetCreateOrder } = useAction(
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
      setAdjustmentReason(defaultAdjustmentReason);
      setIsEmployeeSale(defaultIsEmployeeSale);
    } else {
      form.reset();
      setSelectedProducts([]);
      setCustomerId(undefined);
      setPaymentMethod(undefined);
      setApplyServiceCharge(true);
      setDiscountAmount(0);
      setExtraAmount(0);
      setAdjustmentReason("");
      setIsEmployeeSale(false);
      resetUpsertSale();
      resetCreateOrder();
    }
  }, [
    form,
    isOpen,
    defaultSelectedProducts,
    saleDate,
    defaultCustomerId,
    defaultPaymentMethod,
    defaultTipAmount,
    defaultDiscountAmount,
    defaultExtraAmount,
    defaultAdjustmentReason,
    defaultIsEmployeeSale,
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
          operationalCost: Number(product.operationalCost),
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
    const subtotal = selectedProducts.reduce((acc, p) => {
      const unitPrice = isEmployeeSale 
        ? (Number(p.cost || 0) + Number(p.operationalCost || 0))
        : Number(p.price);
      return acc + unitPrice * p.quantity;
    }, 0);
    
    const itenCount = selectedProducts.reduce((acc, p) => acc + p.quantity, 0);
    
    // Calculate 10% with 2 decimal precision
    const serviceChargeAmount = applyServiceCharge 
      ? Math.round(subtotal * 0.1 * 100) / 100 
      : 0;

    const totalBeforeDiscount = subtotal + serviceChargeAmount;
    
    // Boundary check: Discount cannot exceed the total before discount
    const effectiveDiscount = Math.min(discountAmount, totalBeforeDiscount);
    const totalWithTip = Math.max(0, Math.round((totalBeforeDiscount - effectiveDiscount + extraAmount) * 100) / 100);
    
    return { subtotal, itenCount, serviceChargeAmount, totalWithTip, effectiveDiscount, extraAmount };
  }, [selectedProducts, applyServiceCharge, isEmployeeSale, discountAmount, extraAmount]);

  const handleOpenOrder = () => {
    if (selectedProducts.length === 0) return;

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
      hasServiceTax: applyServiceCharge,
      discountAmount: totals.effectiveDiscount,
      extraAmount: totals.extraAmount,
      adjustmentReason: adjustmentReason || undefined,
      isEmployeeSale,
    });
  };

  const handleFinalizeSale = () => {
    if (selectedProducts.length === 0) return;

    if (!paymentMethod) {
      toast.error("Selecione uma forma de pagamento para finalizar a venda.");
      return;
    }

    executeUpsertSale({
      id: saleId,
      date: date ? new Date(date + "T12:00:00") : undefined,
      customerId,
      paymentMethod,
      tipAmount: totals.serviceChargeAmount,
      discountAmount: totals.effectiveDiscount,
      extraAmount: totals.extraAmount,
      adjustmentReason: adjustmentReason || undefined,
      isEmployeeSale,
      products: selectedProducts.map((p) => ({
        id: p.id,
        quantity: p.quantity,
      })),
    });
  };

  const handleCustomerSuccess = (customer: any) => {
    const newOption = {
      label: `${customer.name} ${customer.phoneNumber ? `(${customer.phoneNumber})` : ""}`,
      value: customer.id,
    };
    setLocalCustomerOptions((prev) => [...prev, newOption]);
    setCustomerId(customer.id);
    setCustomerDialogOpen(false);
    setCustomerSearchValue("");
  };

  const getCustomerDefaultValues = () => {
    const digitsOnly = customerSearchValue.replace(/\D/g, "");
    if (digitsOnly.length >= 8) {
      return { phoneNumber: digitsOnly, name: "" };
    }
    return { name: customerSearchValue, phoneNumber: "" };
  };

  return (
    <SheetContent className="flex h-full !max-w-full lg:!max-w-5xl flex-col border-none p-0">
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

        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
          {/* Left Column: Form Controls & Resumo */}
          <div className="flex flex-col border-r border-border bg-muted/30">
            <div className="flex-1 space-y-8 overflow-y-auto p-6 scrollbar-hide">
              {/* Sale Metadata Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-border bg-background p-6 shadow-sm">
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
                      options={localCustomerOptions}
                      value={customerId || ""}
                      onChange={(val) => setCustomerId(val || undefined)}
                      placeholder="Selecione o Cliente..."
                      searchValue={customerSearchValue}
                      onSearchValueChange={setCustomerSearchValue}
                      emptyContent={
                        <div className="p-2">
                          <Button
                            variant="secondary"
                            className="w-full gap-2 text-xs font-bold uppercase tracking-tight"
                            onClick={() => setCustomerDialogOpen(true)}
                          >
                            <PlusIcon size={14} />
                            Criar "{customerSearchValue}"
                          </Button>
                        </div>
                      }
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

            {/* Column Action Area */}
            <div className="border-t border-border bg-background p-6 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
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

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                    Modo Funcionário
                  </Label>
                  <div className="flex h-12 items-center justify-between rounded-xl border border-border bg-muted/50 px-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={isEmployeeSale}
                        onCheckedChange={setIsEmployeeSale}
                        id="employee-sale"
                      />
                      <Label
                        htmlFor="employee-sale"
                        className="text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {isEmployeeSale ? "Preço de Custo" : "Preço de Venda"}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adjustment Section */}
              <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4">
                <div className="flex flex-col gap-4">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                           <span className="text-xs font-black">⚙️</span>
                        </div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ajuste Manual</Label>
                      </div>

                      <Tabs 
                        value={adjustmentType} 
                        onValueChange={(val) => {
                          const type = val as "discount" | "extra";
                          setAdjustmentType(type);
                          // Reset the other value when switching
                          if (type === "discount") setExtraAmount(0);
                          else setDiscountAmount(0);
                        }} 
                        className="h-8"
                      >
                        <TabsList className="h-8 bg-muted/50 p-1">
                          <TabsTrigger value="discount" className="h-6 text-[10px] font-bold uppercase">Desconto</TabsTrigger>
                          <TabsTrigger value="extra" className="h-6 text-[10px] font-bold uppercase">Acréscimo</TabsTrigger>
                        </TabsList>
                      </Tabs>
                   </div>

                   <div className="flex items-center justify-between border-t border-border/50 pt-4">
                      <div className="space-y-0.5">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                           {adjustmentType === "discount" ? "Valor do Desconto" : "Valor do Acréscimo"}
                         </Label>
                         {adjustmentType === "discount" && (
                           <p className="text-[9px] font-medium text-muted-foreground italic">
                             Máx: {formatCurrency(totals.subtotal + totals.serviceChargeAmount)}
                           </p>
                         )}
                      </div>
                      <div className="relative w-32">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">R$</span>
                         <Input 
                           type="number"
                           min={0}
                           placeholder="0,00"
                           className="h-9 pl-8 font-black text-primary"
                           value={adjustmentType === "discount" ? (discountAmount || "") : (extraAmount || "")}
                           onChange={(e) => {
                             const val = parseFloat(e.target.value);
                             const amount = isNaN(val) ? 0 : Math.max(0, val);
                             if (adjustmentType === "discount") {
                               setDiscountAmount(amount);
                             } else {
                               setExtraAmount(amount);
                             }
                           }}
                         />
                      </div>
                   </div>
                </div>

                {(discountAmount > 0 || extraAmount > 0) && (
                  <div className="space-y-1.5 border-t border-border pt-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <CheckIcon size={12} className="text-primary" /> Justificativa do Ajuste
                    </Label>
                    <Input 
                      placeholder="Ex: Cliente VIP, Troco retido, Cortesia..."
                      className="h-8 text-xs italic"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-2">
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

              <div className="mt-6 flex flex-col gap-3">
                {paymentMethod && (
                  <Button
                    className="h-12 w-full gap-2 bg-emerald-600 text-sm font-black uppercase tracking-widest text-background shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                    data-testid="finalize-sale-button"
                    disabled={selectedProducts.length === 0 || isPending}
                    onClick={handleFinalizeSale}
                  >
                    {isUpsertPending ? (
                      <span className="animate-pulse">Finalizando...</span>
                    ) : (
                      <>
                        <CheckIcon size={18} />
                        Finalizar Venda
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant={paymentMethod ? "outline" : "default"}
                  className={cn(
                    "h-12 w-full gap-2 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50",
                    !paymentMethod && "shadow-lg shadow-primary/20",
                  )}
                  data-testid="open-order-button"
                  disabled={selectedProducts.length === 0 || isPending}
                  onClick={handleOpenOrder}
                >
                  {isOrderPending ? (
                    <span className="animate-pulse">Salvando...</span>
                  ) : (
                    <>
                      <PlusIcon size={18} />
                      {saleId ? "Salvar Alterações" : "Abrir Comanda"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

          {/* Right Column: Added Products Table */}
          <div className="flex flex-col bg-background p-6">
            <div className="mb-6 flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase italic tracking-tighter text-foreground">
                Itens da Venda
              </h4>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                {selectedProducts.length} produtos adicionados
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6">
              {/* Product Composition Area (Moved here) */}
              <div className="space-y-6 rounded-2xl border border-border bg-muted/20 p-6 shadow-sm">
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
                      <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-muted p-4 animate-in fade-in slide-in-from-top-2 md:flex-row md:items-center">
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

              {selectedProducts.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 text-muted-foreground">
                  <ShoppingCartIcon size={32} className="mb-3 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest opacity-50">
                    Carrinho Vazio
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-background shadow-sm">
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
        </div>

        {/* Quick Customer Dialog */}
        <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
          <UpsertCustomerDialogContent
            setDialogIsOpen={setCustomerDialogOpen}
            categories={categories}
            stages={stages}
            onSuccess={handleCustomerSuccess}
            defaultValues={getCustomerDefaultValues() as any}
          />
        </Dialog>
      </div>
    </SheetContent>
  );
};

export default UpsertSheetContent;

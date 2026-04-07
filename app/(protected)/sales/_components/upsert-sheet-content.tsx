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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";
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
  const [discountAmount, setDiscountAmount] = useState<number>(
    defaultDiscountAmount,
  );
  const [extraAmount, setExtraAmount] = useState<number>(defaultExtraAmount);
  const [adjustmentReason, setAdjustmentReason] = useState<string>(
    defaultAdjustmentReason,
  );
  const [adjustmentType, setAdjustmentType] = useState<"discount" | "extra">(
    defaultExtraAmount > 0 ? "extra" : "discount",
  );
  const [isEmployeeSale, setIsEmployeeSale] = useState<boolean>(
    defaultIsEmployeeSale,
  );

  // Quick Customer State
  const [customerSearchValue, setCustomerSearchValue] = useState("");
  const [localCustomerOptions, setLocalCustomerOptions] =
    useState<ComboboxOption[]>(customerOptions);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // Sync local options with parent options
  useEffect(() => {
    setLocalCustomerOptions(customerOptions);
  }, [customerOptions]);

  const {
    execute: executeUpsertSale,
    isPending: isUpsertPending,
    reset: resetUpsertSale,
  } = useAction(upsertSale, {
    onError: ({ error: { validationErrors, serverError } }) => {
      const flattenedErrors = flattenValidationErrors(validationErrors);
      toast.error(serverError ?? flattenedErrors.formErrors[0]);
    },
    onSuccess: () => {
      toast.success("Venda realizada com sucesso.");
      setSheetIsOpen(false);
    },
  });

  const {
    execute: executeCreateOrder,
    isPending: isOrderPending,
    reset: resetCreateOrder,
  } = useAction(createOrderAction, {
    onError: ({ error: { serverError } }) => {
      toast.error(serverError || "Erro ao criar comanda.");
    },
    onSuccess: () => {
      toast.success("Comanda (Pedido) criada com sucesso! 📝");
      setSheetIsOpen(false);
    },
  });

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
      setApplyServiceCharge(
        defaultTipAmount === undefined ? true : Number(defaultTipAmount) > 0,
      );
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
        ? Number(p.cost || 0) + Number(p.operationalCost || 0)
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
    const totalWithTip = Math.max(
      0,
      Math.round(
        (totalBeforeDiscount - effectiveDiscount + extraAmount) * 100,
      ) / 100,
    );

    return {
      subtotal,
      itenCount,
      serviceChargeAmount,
      totalWithTip,
      effectiveDiscount,
      extraAmount,
    };
  }, [
    selectedProducts,
    applyServiceCharge,
    isEmployeeSale,
    discountAmount,
    extraAmount,
  ]);

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
    <TooltipProvider>
      <SheetContent className="flex h-full !max-w-full flex-col border-none p-0 lg:!max-w-5xl">
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 border-b border-border bg-background p-3">
            <div className="flex items-center justify-between gap-4">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                    <ShoppingCartIcon size={18} />
                  </div>
                  <SheetTitle className="whitespace-nowrap text-lg font-black uppercase italic tracking-tighter">
                    {saleId ? "Editar Venda" : "Nova Venda"}
                  </SheetTitle>
                </div>
                <SheetDescription className="text-[10px] font-semibold uppercase tracking-tight text-muted-foreground">
                  Processamento em tempo real
                </SheetDescription>
              </SheetHeader>

              <div className="flex items-center gap-2">
                <DatePicker
                  value={date ? parseISO(date) : undefined}
                  onChange={(newDate) =>
                    setDate(newDate ? format(newDate, "yyyy-MM-dd") : "")
                  }
                  className="h-9 w-[140px] border-border text-[10px] font-bold"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setCustomerDialogOpen(true)}
                  className="h-9 gap-2 px-3 text-[10px] font-black uppercase tracking-tight text-muted-foreground transition-all hover:bg-muted"
                >
                  <PlusIcon size={14} />
                  Novo Cliente
                </Button>
              </div>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
            {/* Left Column: Form Controls & Resumo */}
            <div className="flex min-h-0 flex-col border-r border-border bg-muted/30">
              <div className="scrollbar-hide hover:scrollbar-default flex-1 space-y-2 overflow-y-auto p-2 transition-all">
                {/* Customer Selection Section */}
                <div className="space-y-2 rounded-2xl border border-border bg-background p-3 shadow-sm">
                  <div className="space-y-1.5">
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
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                              <CheckIcon size={12} /> Avulsa Ativa
                            </span>
                          ) : (
                            "Venda Avulsa"
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="text-[10px] font-bold uppercase"
                      >
                        Permite finalizar sem vincular a um cliente
                      </TooltipContent>
                    </Tooltip>

                    {customerId && (
                      <p className="text-[9px] font-bold uppercase italic text-muted-foreground">
                        Cliente vinculado
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Column Action Area */}
              <div className="mt-auto border-t border-border bg-background px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <div className="mb-2 grid grid-cols-2 gap-2 border-b border-border pb-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex cursor-help items-center gap-2 rounded-lg bg-muted/50 p-1.5 transition-colors hover:bg-muted">
                        <Switch
                          checked={applyServiceCharge}
                          onCheckedChange={setApplyServiceCharge}
                          id="service-charge"
                          className="origin-left scale-75"
                        />
                        <div className="flex flex-col">
                          <Label
                            htmlFor="service-charge"
                            className="mb-0.5 text-[9px] font-black uppercase leading-none text-muted-foreground"
                          >
                            Serviço (10%)
                          </Label>
                          <span
                            className={cn(
                              "text-[10px] font-bold leading-none transition-colors",
                              applyServiceCharge
                                ? "text-primary"
                                : "text-muted-foreground/30",
                            )}
                          >
                            {formatCurrency(totals.serviceChargeAmount)}
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="text-[10px] font-bold uppercase"
                    >
                      Adiciona 10% de taxa de serviço sobre o total
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex cursor-help items-center gap-2 rounded-lg bg-muted/50 p-1.5 transition-colors hover:bg-muted">
                        <Switch
                          checked={isEmployeeSale}
                          onCheckedChange={setIsEmployeeSale}
                          id="employee-sale"
                          className="origin-left scale-75"
                        />
                        <div className="flex flex-col">
                          <Label
                            htmlFor="employee-sale"
                            className="mb-0.5 text-[9px] font-black uppercase leading-none text-muted-foreground"
                          >
                            Funcionário
                          </Label>
                          <span
                            className={cn(
                              "text-[10px] font-bold leading-none transition-colors",
                              isEmployeeSale
                                ? "text-emerald-600"
                                : "text-muted-foreground/30",
                            )}
                          >
                            {isEmployeeSale ? "Ativado" : "Desligado"}
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="text-[10px] font-bold uppercase"
                    >
                      Venda a preço de custo (Base + Op) para equipe
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="mb-2 flex items-center justify-between">
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
                    <h2 className="text-2xl font-black leading-none tracking-tighter text-primary">
                      {formatCurrency(totals.totalWithTip)}
                    </h2>
                  </div>
                </div>

                {/* Adjustment Section */}
                <div className="grid grid-cols-1 gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-2">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Ajuste Manual
                        </Label>
                      </div>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Tabs
                            value={adjustmentType}
                            onValueChange={(val) => {
                              const type = val as "discount" | "extra";
                              setAdjustmentType(type);
                              if (type === "discount") setExtraAmount(0);
                              else setDiscountAmount(0);
                            }}
                            className="h-7"
                          >
                            <TabsList className="h-7 bg-muted/50 p-0.5">
                              <TabsTrigger
                                value="discount"
                                className="h-6 text-[10px] font-bold uppercase"
                              >
                                Desconto
                              </TabsTrigger>
                              <TabsTrigger
                                value="extra"
                                className="h-6 text-[10px] font-bold uppercase"
                              >
                                Acréscimo
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </TooltipTrigger>
                        <TooltipContent
                          side="left"
                          className="text-[10px] font-bold uppercase"
                        >
                          Alterne entre conceder desconto ou adicionar um valor
                          extra
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-2">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {adjustmentType === "discount"
                            ? "Valor"
                            : "Acréscimo"}
                        </Label>
                      </div>
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">
                          R$
                        </span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0,00"
                          className="h-8 pl-8 text-xs font-black text-primary"
                          value={
                            adjustmentType === "discount"
                              ? discountAmount || ""
                              : extraAmount || ""
                          }
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
                    <div className="space-y-1.5 border-t border-border pt-2">
                      <Input
                        placeholder="Justificativa..."
                        className="h-7 text-[10px] italic"
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-1">
                  <Label className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                    Forma de Pagamento
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(val) =>
                      setPaymentMethod(val as PaymentMethod)
                    }
                  >
                    <SelectTrigger
                      className="h-12 border-border font-bold focus:ring-primary/20"
                      aria-label="Forma de Pagamento"
                      data-testid="payment-method-select"
                    >
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="border-border">
                      <SelectItem
                        value="CASH"
                        className="font-bold text-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <BanknoteIcon
                            size={16}
                            className="text-emerald-500"
                          />
                          Dinheiro
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="PIX"
                        className="font-bold text-foreground"
                      >
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
                          <WalletIcon
                            size={16}
                            className="text-muted-foreground"
                          />
                          Outro
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div
                  className={cn(
                    "mt-2 grid gap-2",
                    paymentMethod ? "grid-cols-2" : "grid-cols-1",
                  )}
                >
                  {paymentMethod && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="h-12 w-full gap-2 bg-emerald-600 text-[11px] font-black uppercase tracking-tight text-background shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
                          data-testid="finalize-sale-button"
                          disabled={selectedProducts.length === 0 || isPending}
                          onClick={handleFinalizeSale}
                        >
                          {isUpsertPending ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            <>
                              <CheckIcon size={16} />
                              Finalizar
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="text-center text-[10px] font-bold uppercase"
                      >
                        Finaliza a venda com pagamento imediato
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={paymentMethod ? "outline" : "default"}
                        className={cn(
                          "h-12 w-full gap-2 text-[11px] font-black uppercase tracking-tight transition-all active:scale-[0.98] disabled:opacity-50",
                          !paymentMethod && "shadow-lg shadow-primary/20",
                        )}
                        data-testid="open-order-button"
                        disabled={selectedProducts.length === 0 || isPending}
                        onClick={handleOpenOrder}
                      >
                        {isOrderPending ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <>
                            <PlusIcon size={16} />
                            {saleId ? "Salvar" : "Comanda"}
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="text-center text-[10px] font-bold uppercase"
                    >
                      Salva o pedido sem processar o pagamento agora
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Right Column: Added Products Table */}
            <div className="flex min-h-0 flex-col bg-background p-2">
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase italic tracking-tighter text-foreground">
                  Itens da Venda
                </h4>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  {selectedProducts.length} produtos adicionados
                </p>
              </div>

              <div className="scrollbar-hide hover:scrollbar-default flex-1 overflow-y-auto pr-1 transition-all">
                {/* Product Composition Area (Moved here) */}
                <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground">
                        Compor Carrinho
                      </h4>
                      <p className="text-[9px] font-medium uppercase text-muted-foreground">
                        Adicione produtos e quantidades
                      </p>
                    </div>
                  </div>

                  <Form {...form}>
                    <form
                      className="space-y-3"
                      onSubmit={form.handleSubmit(onSubmit)}
                    >
                      <div className="flex flex-col gap-3">
                        <FormField
                          control={form.control}
                          name="productId"
                          render={({ field }) => (
                            <FormItem>
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
                            <FormItem>
                              <FormLabel className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground">
                                Quantidade
                                {currentProduct && (
                                  <span
                                    className={cn(
                                      "text-[9px] font-bold lowercase italic",
                                      Number(currentProduct.stock) < 0
                                        ? "text-destructive"
                                        : "text-muted-foreground/60",
                                    )}
                                  >
                                    {Number(currentProduct.stock)} em estoque
                                  </span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <QuantityStepper
                                  value={field.value}
                                  onChange={field.onChange}
                                  className="h-10 w-full"
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {currentProduct && (
                        <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-muted p-3 animate-in fade-in slide-in-from-top-2 md:flex-row md:items-center">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                              Resumo Parcial
                            </p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-black text-foreground">
                                {formatCurrency(
                                  Number(currentProduct.price) *
                                    selectedQuantity,
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
                  <div className="mt-2 flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 text-muted-foreground">
                    <ShoppingCartIcon size={32} className="mb-3 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest opacity-50">
                      Carrinho Vazio
                    </p>
                  </div>
                ) : (
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
                        {selectedProducts.map((p) => (
                          <TableRow key={p.id} className="group border-border">
                            <TableCell className="px-2 py-2">
                              <p className="max-w-[120px] truncate text-xs font-bold text-foreground">
                                {p.name}
                              </p>
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              <QuantityStepper
                                value={p.quantity}
                                onChange={(val) => updateQuantity(p.id, val)}
                                max={p.stock}
                                className="h-7 w-20"
                              />
                            </TableCell>
                            <TableCell className="px-2 py-2 text-right text-[11px] font-medium text-muted-foreground">
                              {formatCurrency(p.price)}
                            </TableCell>
                            <TableCell className="px-2 py-2 text-right text-[11px] font-black text-foreground">
                              {formatCurrency(p.price * p.quantity)}
                            </TableCell>
                            <TableCell className="px-2 py-2 text-center">
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
          <Dialog
            open={customerDialogOpen}
            onOpenChange={setCustomerDialogOpen}
          >
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
    </TooltipProvider>
  );
};

export default UpsertSheetContent;

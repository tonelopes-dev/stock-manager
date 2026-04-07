"use client";

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/_components/ui/sheet";
import { ShoppingCartIcon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import { upsertSale } from "@/app/_actions/sale/upsert-sale";
import { createOrderAction } from "@/app/_actions/order/create-order";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { flattenValidationErrors } from "next-safe-action";
import { ProductDto } from "@/app/_data-access/product/get-products";
import {
  TooltipProvider,
} from "@/app/_components/ui/tooltip";
import { CartComposer } from "./upsert-sheet-parts/cart-composer";
import { CartTable } from "./upsert-sheet-parts/cart-table";
import { CustomerSection } from "./upsert-sheet-parts/customer-section";
import { FinancialSummary } from "./upsert-sheet-parts/financial-summary";
import { PaymentSelector } from "./upsert-sheet-parts/payment-selector";
import { ActionFooter } from "./upsert-sheet-parts/action-footer";
import { useSaleTotals } from "./upsert-sheet-parts/use-sale-totals";
import { format, parseISO } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { ComboboxOption } from "@/app/_components/ui/combobox";
import { DatePicker } from "@/app/_components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import UpsertCustomerDialogContent from "../../customers/_components/upsert-dialog-content";
import { PlusIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { useFieldArray } from "react-hook-form";

const itemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string(),
  price: z.coerce.number(),
  cost: z.coerce.number(),
  operationalCost: z.coerce.number(),
  quantity: z.coerce.number().int().positive(),
  stock: z.coerce.number(),
});

const formSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  date: z.string(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional().nullable(),
  items: z.array(itemSchema),
  applyServiceCharge: z.boolean(),
  isEmployeeSale: z.boolean(),
  discountAmount: z.coerce.number().min(0),
  extraAmount: z.coerce.number().min(0),
  adjustmentReason: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface SelectedProduct {
  productId: string;
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
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerSearchValue, setCustomerSearchValue] = useState("");

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: defaultCustomerId || undefined,
      date: saleDate ? format(new Date(saleDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      paymentMethod: (defaultPaymentMethod as PaymentMethod) || undefined,
      items: defaultSelectedProducts ?? [],
      applyServiceCharge: defaultTipAmount === undefined ? true : Number(defaultTipAmount) > 0,
      isEmployeeSale: defaultIsEmployeeSale,
      discountAmount: defaultDiscountAmount,
      extraAmount: defaultExtraAmount,
      adjustmentReason: defaultAdjustmentReason,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

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

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      resetUpsertSale();
      resetCreateOrder();
    }
  }, [form, isOpen, resetUpsertSale, resetCreateOrder]);

  // Hook for totals (used in handlers)
  const totals = useSaleTotals(form.watch as any);

  const handleOpenOrder = () => {
    const values = form.getValues();
    if (values.items.length === 0) return;

    if (!values.customerId) {
      toast.error("Para abrir uma comanda, selecione um cliente.");
      return;
    }

    executeCreateOrder({
      companyId,
      customerId: values.customerId,
      items: values.items.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
      })),
      notes: "Painel de Gestão",
      hasServiceTax: values.applyServiceCharge,
      discountAmount: totals.effectiveDiscount,
      extraAmount: totals.extraAmount,
      adjustmentReason: values.adjustmentReason || undefined,
      isEmployeeSale: values.isEmployeeSale,
    });
  };

  const handleFinalizeSale = () => {
    const values = form.getValues();
    if (values.items.length === 0) return;

    if (!values.paymentMethod) {
      toast.error("Selecione uma forma de pagamento.");
      return;
    }

    executeUpsertSale({
      id: saleId,
      date: values.date ? new Date(values.date + "T12:00:00") : undefined,
      customerId: values.customerId || undefined,
      paymentMethod: values.paymentMethod,
      tipAmount: totals.serviceChargeAmount,
      discountAmount: totals.effectiveDiscount,
      extraAmount: totals.extraAmount,
      adjustmentReason: values.adjustmentReason || undefined,
      isEmployeeSale: values.isEmployeeSale,
      products: values.items.map((p) => ({
        id: p.productId,
        quantity: p.quantity,
      })),
    });
  };

  const handleCustomerSuccess = (customer: any) => {
    form.setValue("customerId", customer.id);
    setCustomerDialogOpen(false);
    setCustomerSearchValue("");
  };

  return (
    <TooltipProvider>
      <FormProvider {...form}>
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
                    value={form.watch("date") ? parseISO(form.watch("date")) : undefined}
                    onChange={(newDate) =>
                      form.setValue("date", newDate ? format(newDate, "yyyy-MM-dd") : "")
                    }
                    className="h-9 w-[130px] border-border text-[10px] font-bold"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setCustomerDialogOpen(true)}
                    className="h-9 gap-1.5 px-3 text-[10px] font-black uppercase tracking-tight text-muted-foreground transition-all hover:bg-muted"
                  >
                    <PlusIcon size={14} />
                    Novo Cliente
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
              <div className="flex min-h-0 flex-col border-r border-border bg-muted/30">
                <div className="scrollbar-hide hover:scrollbar-default flex-1 space-y-2 overflow-y-auto p-2 transition-all">
                  <CustomerSection
                    customerOptions={customerOptions}
                    categories={categories}
                    stages={stages}
                  />
                </div>

                <div className="mt-auto border-t border-border bg-background px-3 py-2">
                  <FinancialSummary />
                  <PaymentSelector />
                  <ActionFooter
                    onSaveOrder={handleOpenOrder}
                    onFinalizeSale={handleFinalizeSale}
                    isPending={isPending}
                    isOrderPending={isOrderPending}
                    isUpsertPending={isUpsertPending}
                    saleId={saleId}
                  />
                </div>
              </div>

              <div className="flex min-h-0 flex-col bg-background p-2">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase italic tracking-tighter text-foreground">
                    Itens da Venda
                  </h4>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    {form.watch("items")?.length || 0} produtos
                  </p>
                </div>

                <div className="scrollbar-hide hover:scrollbar-default flex-1 overflow-y-auto pr-1 transition-all">
                  <CartComposer 
                    products={products} 
                    productOptions={productOptions} 
                    fields={fields}
                    append={append}
                  />
                  <CartTable 
                    fields={fields}
                    remove={remove}
                    update={update}
                  />
                </div>
              </div>
            </div>
          </div>
        </SheetContent>

        {/* Global Quick Customer Dialog */}
        <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
          <UpsertCustomerDialogContent
            setDialogIsOpen={setCustomerDialogOpen}
            categories={categories}
            stages={stages}
            onSuccess={handleCustomerSuccess}
            defaultValues={{ name: customerSearchValue, phoneNumber: "" } as any}
          />
        </Dialog>
      </FormProvider>
    </TooltipProvider>
  );
};

export default UpsertSheetContent;

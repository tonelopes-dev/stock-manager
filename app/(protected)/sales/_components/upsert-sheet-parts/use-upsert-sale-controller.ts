import { createOrderAction } from "@/app/_actions/order/create-order";
import { upsertSale } from "@/app/_actions/sale/upsert-sale";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentMethod } from "@prisma/client";
import { format } from "date-fns";
import { flattenValidationErrors } from "next-safe-action";
import { useAction } from "next-safe-action/hooks";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm, UseFormWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useSaleTotals } from "./use-sale-totals";

// 1. Schemas
export const itemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string(),
  price: z.coerce.number(),
  cost: z.coerce.number(),
  operationalCost: z.coerce.number(),
  quantity: z.coerce.number().int().positive(),
  stock: z.coerce.number(),
  notes: z.string().optional(),
});

export const formSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  date: z.string(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional().nullable(),
  items: z.array(itemSchema),
  applyServiceCharge: z.boolean(),
  isEmployeeSale: z.boolean(),
  discountAmount: z.coerce.number().min(0),
  extraAmount: z.coerce.number().min(0),
  adjustmentReason: z.string().optional(),
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type FormSchema = z.infer<typeof formSchema>;

export interface SelectedProduct {
  productId: string;
  name: string;
  price: number;
  cost: number;
  operationalCost: number;
  quantity: number;
  stock: number;
}

// 2. Controller Props
export interface UseUpsertSaleControllerProps {
  companyId: string;
  saleId?: string;
  saleDate?: Date;
  defaultCustomerId?: string | null;
  defaultSelectedProducts?: SelectedProduct[];
  defaultPaymentMethod?: PaymentMethod | null;
  defaultTipAmount?: number | null;
  defaultDiscountAmount?: number;
  defaultExtraAmount?: number;
  defaultAdjustmentReason?: string;
  defaultIsEmployeeSale?: boolean;
  isPendingSale?: boolean;
  setSheetIsOpen: Dispatch<SetStateAction<boolean>>;
}

// 3. Controller Hook
export const useUpsertSaleController = ({
  companyId,
  saleId,
  saleDate,
  defaultCustomerId,
  defaultSelectedProducts,
  defaultPaymentMethod,
  defaultTipAmount,
  defaultDiscountAmount = 0,
  defaultExtraAmount = 0,
  defaultAdjustmentReason = "",
  defaultIsEmployeeSale = false,
  isPendingSale = false,
  setSheetIsOpen,
}: UseUpsertSaleControllerProps) => {
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerSearchValue, setCustomerSearchValue] = useState("");

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: defaultCustomerId || undefined,
      date: saleDate ? format(new Date(saleDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      paymentMethod: defaultPaymentMethod || undefined,
      items: defaultSelectedProducts ?? [],
      applyServiceCharge: defaultTipAmount === undefined ? true : Number(defaultTipAmount) > 0,
      isEmployeeSale: defaultIsEmployeeSale,
      discountAmount: defaultDiscountAmount,
      extraAmount: defaultExtraAmount,
      adjustmentReason: defaultAdjustmentReason,
    },
  });

  const totals = useSaleTotals(form.watch as UseFormWatch<FormSchema>);

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
      toast.success("Venda atualizada com sucesso.");
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

  const resetAll = () => {
    form.reset();
    resetUpsertSale();
    resetCreateOrder();
  };

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
      notes: values.notes || "Venda ERP",
      tableNumber: values.tableNumber || undefined,
      hasServiceTax: values.applyServiceCharge,
      discountAmount: totals.effectiveDiscount,
      extraAmount: totals.extraAmount,
      adjustmentReason: values.adjustmentReason || undefined,
      isEmployeeSale: values.isEmployeeSale,
      items: values.items.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
        notes: p.notes,
      })),
    });
  };

  const handleFinalizeSale = () => {
    const values = form.getValues();
    if (values.items.length === 0) return;

    if (!isPendingSale && !values.paymentMethod) {
      toast.error("Selecione uma forma de pagamento.");
      return;
    }

    executeUpsertSale({
      id: saleId,
      date: values.date ? new Date(values.date + "T12:00:00.000Z") : undefined,
      customerId: values.customerId || undefined,
      paymentMethod: values.paymentMethod || null,
      tipAmount: totals.serviceChargeAmount,
      discountAmount: totals.effectiveDiscount,
      extraAmount: totals.extraAmount,
      adjustmentReason: values.adjustmentReason || undefined,
      isEmployeeSale: values.isEmployeeSale,
      status: isPendingSale ? "PENDING_PAYMENT" : "ACTIVE",
      products: values.items.map((p) => ({
        id: p.productId,
        quantity: p.quantity,
      })),
    });
  };

  const handleCustomerSuccess = (customer: { id: string }) => {
    form.setValue("customerId", customer.id);
    setCustomerDialogOpen(false);
    setCustomerSearchValue("");
  };

  return {
    form,
    totals,
    isPending,
    isOrderPending,
    isUpsertPending,
    customerDialogOpen,
    setCustomerDialogOpen,
    customerSearchValue,
    setCustomerSearchValue,
    handleOpenOrder,
    handleFinalizeSale,
    handleCustomerSuccess,
    resetAll,
  };
};

export type UpsertSaleController = ReturnType<typeof useUpsertSaleController>;

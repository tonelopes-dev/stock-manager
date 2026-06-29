import { useMemo } from "react";
import { useFormContext, UseFormWatch, FieldValues } from "react-hook-form";

interface SaleFormItem {
  price: number;
  cost: number;
  operationalCost: number;
  quantity: number;
}

interface SaleFormValues {
  items: SaleFormItem[];
  isEmployeeSale: boolean;
  applyServiceCharge: boolean;
  discountAmount: number;
  extraAmount: number;
}

export const useSaleTotals = <T extends FieldValues>(externalWatch?: UseFormWatch<T>) => {
  const context = useFormContext<T>();
  const watch = externalWatch || context?.watch;

  if (!watch) {
    throw new Error("useSaleTotals must be used within a FormProvider or provided with a watch function.");
  }

  const formValues = watch();
  const values = formValues as unknown as SaleFormValues;

  const watchedItems: SaleFormItem[] = values.items || [];
  const watchedIsEmployeeSale: boolean = values.isEmployeeSale;
  const watchedApplyServiceCharge: boolean = values.applyServiceCharge;
  const watchedDiscountAmount: number = values.discountAmount || 0;
  const watchedExtraAmount: number = values.extraAmount || 0;

  return useMemo(() => {
    const subtotal = watchedItems.reduce((acc: number, p: SaleFormItem) => {
      const unitPrice = watchedIsEmployeeSale
        ? Number(p.cost || 0) + Number(p.operationalCost || 0)
        : Number(p.price);
      return acc + unitPrice * (p.quantity || 0);
    }, 0);

    const itenCount = watchedItems.reduce((acc: number, p: SaleFormItem) => acc + (p.quantity || 0), 0);

    const serviceChargeAmount = watchedApplyServiceCharge
      ? Math.round(subtotal * 0.1 * 100) / 100
      : 0;

    const totalBeforeDiscount = subtotal + serviceChargeAmount;

    const effectiveDiscount = Math.min(watchedDiscountAmount, totalBeforeDiscount);
    const totalWithTip = Math.max(
      0,
      Math.round(
        (totalBeforeDiscount - effectiveDiscount + watchedExtraAmount) * 100,
      ) / 100,
    );

    return {
      subtotal,
      itenCount,
      serviceChargeAmount,
      totalWithTip,
      effectiveDiscount,
      extraAmount: watchedExtraAmount,
    };
  }, [
    watchedItems,
    watchedApplyServiceCharge,
    watchedIsEmployeeSale,
    watchedDiscountAmount,
    watchedExtraAmount,
  ]);
};

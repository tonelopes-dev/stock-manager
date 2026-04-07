import { useMemo } from "react";
import { useFormContext, UseFormWatch } from "react-hook-form";

export const useSaleTotals = (externalWatch?: UseFormWatch<any>) => {
  const context = useFormContext();
  const watch = externalWatch || context?.watch;

  if (!watch) {
    throw new Error("useSaleTotals must be used within a FormProvider or provided with a watch function.");
  }

  const watchedItems = (watch as any)("items") || [];
  const watchedIsEmployeeSale = (watch as any)("isEmployeeSale");
  const watchedApplyServiceCharge = (watch as any)("applyServiceCharge");
  const watchedDiscountAmount = (watch as any)("discountAmount") || 0;
  const watchedExtraAmount = (watch as any)("extraAmount") || 0;

  return useMemo(() => {
    const subtotal = watchedItems.reduce((acc: number, p: any) => {
      const unitPrice = watchedIsEmployeeSale
        ? Number(p.cost || 0) + Number(p.operationalCost || 0)
        : Number(p.price);
      return acc + unitPrice * (p.quantity || 0);
    }, 0);

    const itenCount = watchedItems.reduce((acc: number, p: any) => acc + (p.quantity || 0), 0);

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

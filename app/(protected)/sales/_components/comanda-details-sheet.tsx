"use client";

import { ComandaDto } from "@/app/_data-access/order/get-active-comandas";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";
import {
  TooltipProvider,
} from "@/app/_components/ui/tooltip";
import {
  Sheet as UISheet,
  SheetContent as UISheetContent,
} from "@/app/_components/ui/sheet";

import { useComandaState } from "./comanda-details/use-comanda-state";
import { ComandaHeader } from "./comanda-details/comanda-header";
import { ComandaPaymentSection } from "./comanda-details/comanda-payment-section";
import { ComandaAddItem } from "./comanda-details/comanda-add-item";
import { ComandaItemsList } from "./comanda-details/comanda-items-list";

// ── Props ────────────────────────────────────────────────────────────────

interface ComandaDetailsSheetProps {
  comanda: ComandaDto | null;
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  products: ProductDto[];
  productOptions: ComboboxOption[];
  customerOptions: ComboboxOption[];
  stages: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

// ── Orchestrator ─────────────────────────────────────────────────────────

export const ComandaDetailsSheet = ({
  comanda,
  isOpen,
  onClose,
  companyId,
  products,
  productOptions,
  customerOptions,
  stages,
  categories,
}: ComandaDetailsSheetProps) => {
  const state = useComandaState({
    comanda,
    isOpen,
    onClose,
    companyId,
    products,
    customerOptions,
  });

  if (!comanda) return null;

  return (
    <UISheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <UISheetContent className="flex h-full w-full sm:max-w-full md:max-w-3xl lg:max-w-5xl flex-col border-none bg-background p-0 shadow-2xl">
        <TooltipProvider delayDuration={0}>
          <ComandaHeader
            comanda={comanda}
            isImageOpen={state.isImageOpen}
            setIsImageOpen={state.setIsImageOpen}
          />

          <div className="flex flex-col lg:flex-row h-full flex-1 overflow-y-auto lg:overflow-hidden">
            {/* Left Column: Metrics & Controls */}
            <ComandaPaymentSection
              comanda={comanda}
              totals={state.totals}
              isPartial={state.isPartial}
              isPending={state.isPending}
              isEmployeeSale={state.isEmployeeSale}
              setIsEmployeeSale={state.setIsEmployeeSale}
              adjustmentType={state.adjustmentType}
              handleAdjustmentTypeChange={state.handleAdjustmentTypeChange}
              discountAmount={state.discountAmount}
              setDiscountAmount={state.setDiscountAmount}
              extraAmount={state.extraAmount}
              setExtraAmount={state.setExtraAmount}
              adjustmentReason={state.adjustmentReason}
              setAdjustmentReason={state.setAdjustmentReason}
              applyServiceCharge={state.applyServiceCharge}
              setApplyServiceCharge={state.setApplyServiceCharge}
              paymentMethod={state.paymentMethod}
              setPaymentMethod={state.setPaymentMethod}
              selectedCustomerId={state.selectedCustomerId}
              setSelectedCustomerId={state.setSelectedCustomerId}
              dueDate={state.dueDate}
              setDueDate={state.setDueDate}
              customerOptions={customerOptions}
              selectedItemIds={state.selectedItemIds}
              onPay={state.handlePay}
              generatedPix={state.generatedPix}
              setGeneratedPix={state.setGeneratedPix}
            />

            {/* Right Column: Items */}
            <div className="flex lg:min-h-0 flex-col p-2 order-1 lg:order-2 flex-none lg:flex-1 w-full lg:w-1/2 overflow-visible lg:overflow-y-auto bg-background">
              <ComandaItemsList
                groupedItems={state.groupedItems}
                isGrouped={state.isGrouped}
                setIsGrouped={state.setIsGrouped}
                selectedItemIds={state.selectedItemIds}
                toggleItemSelection={state.toggleItemSelection}
                handleDeleteItem={state.handleDeleteItem}
              />

              <div className="scrollbar-hide hover:scrollbar-default flex-none lg:flex-1 overflow-visible lg:overflow-y-auto pr-1 transition-all">
                <ComandaAddItem
                  productOptions={productOptions}
                  selectedProductId={state.selectedProductId}
                  setSelectedProductId={state.setSelectedProductId}
                  selectedQuantity={state.selectedQuantity}
                  setSelectedQuantity={state.setSelectedQuantity}
                  currentProduct={state.currentProduct}
                  isPending={state.isPending}
                  onAddItem={state.handleAddItem}
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      </UISheetContent>
    </UISheet>
  );
};

export default ComandaDetailsSheet;

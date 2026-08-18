"use client";

import { ComboboxOption } from "@/app/_components/ui/combobox";
import { Dialog } from "@/app/_components/ui/dialog";
import { SheetContent } from "@/app/_components/ui/sheet";
import { TooltipProvider } from "@/app/_components/ui/tooltip";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { PaymentMethod } from "@prisma/client";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FormProvider } from "react-hook-form";
import UpsertCustomerDialogContent from "../../customers/_components/upsert-dialog-content";

import DesktopSaleView from "./desktop-sale-view";
import MobileSaleWizard from "./mobile-sale-wizard";
import { SelectedProduct, useUpsertSaleController } from "./upsert-sheet-parts/use-upsert-sale-controller";

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
  isReadOnly?: boolean;
  isPendingSale?: boolean;
}

const UpsertSheetContent = (props: UpsertSheetContentProps) => {
  const controller = useUpsertSaleController({
    companyId: props.companyId,
    saleId: props.saleId,
    saleDate: props.saleDate,
    defaultCustomerId: props.customerId,
    defaultSelectedProducts: props.defaultSelectedProducts,
    defaultPaymentMethod: props.paymentMethod,
    defaultTipAmount: props.tipAmount,
    defaultDiscountAmount: props.defaultDiscountAmount,
    defaultExtraAmount: props.defaultExtraAmount,
    defaultAdjustmentReason: props.defaultAdjustmentReason,
    defaultIsEmployeeSale: props.defaultIsEmployeeSale,
    isPendingSale: props.isPendingSale,
    setSheetIsOpen: props.setSheetIsOpen,
  });

  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!props.isOpen) {
      controller.resetAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isOpen]);

  return (
    <TooltipProvider>
      <FormProvider {...controller.form}>
        <SheetContent 
          data-testid="upsert-sale-sheet" 
          data-ready={isReady} 
          className="flex h-full w-full !max-w-full flex-col border-none p-0 lg:!max-w-5xl [&>button.absolute]:hidden md:[&>button.absolute]:flex"
        >
          {/* Mobile Wizard (Visível apenas em telas menores) */}
          <div className="flex h-full flex-col md:hidden">
            <MobileSaleWizard controller={controller} {...props} />
          </div>

          {/* Desktop View (Visível apenas em telas médias e maiores) */}
          <div className="hidden h-full flex-col md:flex">
            <DesktopSaleView controller={controller} {...props} />
          </div>
        </SheetContent>

        {/* Global Quick Customer Dialog */}
        <Dialog open={controller.customerDialogOpen} onOpenChange={controller.setCustomerDialogOpen}>
          <UpsertCustomerDialogContent
            setDialogIsOpen={controller.setCustomerDialogOpen}
            categories={props.categories}
            stages={props.stages}
            onSuccess={controller.handleCustomerSuccess}
            defaultValues={{
              name: controller.customerSearchValue,
              phoneNumber: "",
              categoryIds: [],
              stageId: "",
            }}
          />
        </Dialog>
      </FormProvider>
    </TooltipProvider>
  );
};

export default UpsertSheetContent;

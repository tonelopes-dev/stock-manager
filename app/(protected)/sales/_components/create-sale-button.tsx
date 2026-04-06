"use client";

import { Button } from "@/app/_components/ui/button";
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet";
import UpsertSheetContent from "./upsert-sheet-content";
import { ComboboxOption } from "@/app/_components/ui/combobox";
import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { ProductDto } from "@/app/_data-access/product/get-products";

interface UpsertSaleButtonProps {
  products: ProductDto[];
  productOptions: ComboboxOption[];
  customerOptions: ComboboxOption[];
  hasSales?: boolean;
  view?: "gestao" | "inteligencia";
  companyId: string;
  stages: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

const UpsertSaleButton = ({
  products,
  productOptions,
  customerOptions,
  hasSales,
  view,
  companyId,
  stages,
  categories,
}: UpsertSaleButtonProps) => {
  const [sheetIsOpen, setSheetIsOpen] = useState(false);

  return (
    <Sheet open={sheetIsOpen} onOpenChange={setSheetIsOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <PlusIcon size={20} />
          {view === "gestao" ? "Nova Venda/Comanda" : "Nova Venda"}
        </Button>
      </SheetTrigger>
      <UpsertSheetContent
        isOpen={sheetIsOpen}
        setSheetIsOpen={setSheetIsOpen}
        products={products}
        productOptions={productOptions}
        customerOptions={customerOptions}
        hasSales={hasSales}
        companyId={companyId}
        stages={stages}
        categories={categories}
      />
    </Sheet>
  );
};

export default UpsertSaleButton;

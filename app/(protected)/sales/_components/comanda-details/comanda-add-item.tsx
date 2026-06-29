"use client";

import { ComandaDto } from "@/app/_data-access/order/get-active-comandas";
import { ComboboxOption, Combobox } from "@/app/_components/ui/combobox";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { Button } from "@/app/_components/ui/button";
import { QuantityStepper } from "@/app/_components/ui/quantity-stepper";
import { ProductAvailabilityInfo } from "../shared/product-availability-info";

interface ComandaAddItemProps {
  productOptions: ComboboxOption[];
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  selectedQuantity: number;
  setSelectedQuantity: (qty: number) => void;
  currentProduct: ProductDto | undefined;
  isPending: boolean;
  onAddItem: () => void;
}

export const ComandaAddItem = ({
  productOptions,
  selectedProductId,
  setSelectedProductId,
  selectedQuantity,
  setSelectedQuantity,
  currentProduct,
  isPending,
  onAddItem,
}: ComandaAddItemProps) => {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4 shadow-sm">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        + Adicionar Itens
      </h4>
      <div className="flex flex-col gap-3">
        <Combobox
          options={productOptions}
          value={selectedProductId}
          onChange={setSelectedProductId}
          placeholder="Buscar produto..."
        />
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-2">
            <QuantityStepper
              value={selectedQuantity}
              onChange={setSelectedQuantity}
              min={1}
              className="h-10 w-32"
            />
          </div>
          <Button
            onClick={onAddItem}
            disabled={!selectedProductId || isPending}
            className="h-10 flex-1 rounded-xl bg-foreground text-xs font-bold uppercase italic transition-all active:scale-95"
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              "Adicionar"
            )}
          </Button>
        </div>

        {currentProduct && (
          <div className="pt-2 border-t border-border/50">
            <ProductAvailabilityInfo 
              product={currentProduct} 
              className="bg-background/50 rounded-lg p-1"
            />
          </div>
        )}
      </div>
    </div>
  );
};

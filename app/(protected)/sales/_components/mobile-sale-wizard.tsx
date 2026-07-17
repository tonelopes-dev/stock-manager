import { Button } from "@/app/_components/ui/button";
import { SheetHeader, SheetTitle } from "@/app/_components/ui/sheet";
import { formatCurrency } from "@/app/_utils/currency";
import { CheckCircle2, ChevronLeft, ChevronRight, MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon, XIcon } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { useFieldArray } from "react-hook-form";

import { CartComposer } from "./upsert-sheet-parts/cart-composer";
import { CustomerSection } from "./upsert-sheet-parts/customer-section";
import { FinancialSummary } from "./upsert-sheet-parts/financial-summary";
import { PaymentSelector } from "./upsert-sheet-parts/payment-selector";

import { ComboboxOption } from "@/app/_components/ui/combobox";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { UpsertSaleController } from "./upsert-sheet-parts/use-upsert-sale-controller";

interface MobileSaleWizardProps {
  controller: UpsertSaleController;
  saleId?: string;
  isReadOnly?: boolean;
  isPendingSale?: boolean;
  products: ProductDto[];
  productOptions: ComboboxOption[];
  customerOptions: ComboboxOption[];
  categories: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  setSheetIsOpen: Dispatch<SetStateAction<boolean>>;
}

const MobileSaleWizard = ({
  controller,
  saleId,
  isReadOnly = false,
  isPendingSale = false,
  products,
  productOptions,
  customerOptions,
  categories,
  stages,
  setSheetIsOpen,
}: MobileSaleWizardProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const { form, totals, isPending, isOrderPending, isUpsertPending } = controller;

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleNextStep = () => {
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header Fixo */}
      <div className="sticky top-0 z-10 border-b border-border bg-background p-4 flex justify-between items-start">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ShoppingCartIcon size={20} />
            </div>
            <div className="flex flex-col">
              <SheetTitle className="text-xl font-black uppercase italic tracking-tighter">
                {isReadOnly ? "Visualizar Venda" : isPendingSale ? "Editar Comanda" : saleId ? "Editar Venda" : "Nova Venda"}
              </SheetTitle>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">
                Etapa {step} de 2: {step === 1 ? "Produtos" : "Pagamento"}
              </p>
            </div>
          </div>
        </SheetHeader>

        <Button 
          variant="ghost" 
          size="icon" 
          className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 mt-1"
          onClick={() => setSheetIsOpen(false)}
        >
          <XIcon size={28} />
        </Button>
      </div>

      {/* Conteúdo Rolável com Padding extra na base para não ficar atrás do rodapé */}
      <div className="flex-1 overflow-y-auto pb-32">
        {step === 1 && (
          <div className="flex flex-col p-4 gap-4">
            {/* Identificação da Venda (Cliente, Mesa, Obs) */}
            <CustomerSection
              customerOptions={customerOptions}
              categories={categories}
              stages={stages}
              isReadOnly={isReadOnly}
            />

            {/* Buscador de Produtos */}
            {!isReadOnly && (
              <div className="mb-2">
                <CartComposer 
                  products={products} 
                  productOptions={productOptions} 
                  fields={fields}
                  append={append}
                  isReadOnly={isReadOnly}
                />
              </div>
            )}

            {/* Lista Mobile de Itens (Touch Friendly) */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-bold uppercase italic tracking-tighter text-foreground mb-1">
                Itens no Carrinho ({fields.length})
              </h4>
              
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                  <ShoppingCartIcon size={32} className="mb-2 opacity-20" />
                  <p className="text-sm font-semibold">Nenhum produto adicionado</p>
                </div>
              ) : (
                fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col gap-2 p-3 border rounded-xl bg-card">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{field.name}</span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatCurrency(field.price)} un.
                        </span>
                      </div>
                      <span className="font-black text-primary">
                        {formatCurrency(field.price * field.quantity)}
                      </span>
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-10 w-10"
                          onClick={() => remove(index)}
                        >
                          <Trash2Icon size={18} />
                        </Button>

                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-full border-primary/20 bg-primary/5 text-primary active:bg-primary/20"
                            onClick={() => {
                              if (field.quantity > 1) {
                                update(index, { ...field, quantity: field.quantity - 1 });
                              }
                            }}
                          >
                            <MinusIcon size={20} />
                          </Button>
                          
                          <span className="font-black text-lg w-6 text-center">{field.quantity}</span>
                          
                          <Button
                            type="button"
                            variant="default"
                            size="icon"
                            className="h-12 w-12 rounded-full font-black shadow-md"
                            onClick={() => {
                              update(index, { ...field, quantity: field.quantity + 1 });
                            }}
                          >
                            <PlusIcon size={20} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col p-4 gap-6">
            <div className="rounded-xl border border-border bg-card p-1 shadow-sm">
              <FinancialSummary isReadOnly={isReadOnly} />
            </div>

            <div className="rounded-xl border border-border bg-card p-1 shadow-sm">
              <PaymentSelector isReadOnly={isReadOnly} />
            </div>
          </div>
        )}
      </div>

      {/* Rodapé Fixo */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        {step === 1 ? (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-sm font-bold uppercase text-muted-foreground">Total Acumulado</span>
              <span className="text-2xl font-black italic tracking-tighter text-primary">
                {formatCurrency(totals.totalWithTip)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button"
                variant="outline"
                className="flex-1 h-14 text-xs font-black uppercase tracking-tight gap-2 shadow-sm border-2 border-primary/20 text-primary"
                disabled={fields.length === 0 || isPending}
                onClick={controller.handleOpenOrder}
              >
                {isOrderPending ? "..." : (saleId ? "Salvar" : "Abrir Comanda")}
              </Button>

              <Button 
                type="button"
                className="flex-1 h-14 text-xs font-black uppercase tracking-tight gap-1 shadow-lg"
                disabled={fields.length === 0}
                onClick={handleNextStep}
              >
                Pagamento <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline"
              className="h-14 px-3 border-2"
              onClick={handlePrevStep}
            >
              <ChevronLeft size={24} />
            </Button>

            <Button 
              type="button"
              className="flex-1 h-14 text-xs sm:text-sm font-black uppercase tracking-tight gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              disabled={isPending || (fields.length === 0) || (!isPendingSale && !form.watch("paymentMethod"))}
              onClick={controller.handleFinalizeSale}
            >
              {isUpsertPending ? (
                <span className="animate-pulse">...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span className="truncate">
                    {isPendingSale ? "Salvar Pendente" : `Finalizar • ${formatCurrency(totals.totalWithTip)}`}
                  </span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSaleWizard;

import { Button } from "@/app/_components/ui/button";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { SheetDescription, SheetHeader, SheetTitle } from "@/app/_components/ui/sheet";
import { format, parseISO } from "date-fns";
import { PlusIcon, ShoppingCartIcon } from "lucide-react";
import { useFieldArray } from "react-hook-form";

import { ActionFooter } from "./upsert-sheet-parts/action-footer";
import { CartComposer } from "./upsert-sheet-parts/cart-composer";
import { CartTable } from "./upsert-sheet-parts/cart-table";
import { CustomerSection } from "./upsert-sheet-parts/customer-section";
import { FinancialSummary } from "./upsert-sheet-parts/financial-summary";
import { PaymentSelector } from "./upsert-sheet-parts/payment-selector";

import { ComboboxOption } from "@/app/_components/ui/combobox";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { UpsertSaleController } from "./upsert-sheet-parts/use-upsert-sale-controller";

interface DesktopSaleViewProps {
  controller: UpsertSaleController;
  saleId?: string;
  isReadOnly?: boolean;
  isPendingSale?: boolean;
  products: ProductDto[];
  productOptions: ComboboxOption[];
  customerOptions: ComboboxOption[];
  categories: { id: string; name: string }[];
  stages: { id: string; name: string }[];
}

const DesktopSaleView = ({
  controller,
  saleId,
  isReadOnly = false,
  isPendingSale = false,
  products,
  productOptions,
  customerOptions,
  categories,
  stages,
}: DesktopSaleViewProps) => {
  const { form, totals, isPending, isOrderPending, isUpsertPending } = controller;

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-border bg-background p-3">
        <div className="flex items-center justify-between gap-4">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                <ShoppingCartIcon size={18} />
              </div>
              <SheetTitle className="whitespace-nowrap text-lg font-black uppercase italic tracking-tighter">
                {isReadOnly ? "Visualizar Venda" : isPendingSale ? "Editar Comanda Pendente" : saleId ? "Editar Venda" : "Nova Venda"}
              </SheetTitle>
            </div>
            <SheetDescription className="text-[10px] font-semibold uppercase tracking-tight text-muted-foreground">
              {isReadOnly ? "Venda finalizada (Somente Leitura)" : isPendingSale ? "Ajuste de itens aguardando pagamento" : "Processamento em tempo real"}
            </SheetDescription>
          </SheetHeader>

          {!isReadOnly && (
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
                onClick={() => controller.setCustomerDialogOpen(true)}
                className="h-9 gap-1.5 px-3 text-[10px] font-black uppercase tracking-tight text-muted-foreground transition-all hover:bg-muted"
              >
                <PlusIcon size={14} />
                Novo Cliente
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <div className="flex min-h-0 flex-col border-r border-border bg-muted/30">
          <div className="scrollbar-hide hover:scrollbar-default flex-1 space-y-2 overflow-y-auto p-2 transition-all">
            <CustomerSection
              customerOptions={customerOptions}
              categories={categories}
              stages={stages}
              isReadOnly={isReadOnly}
            />
          </div>

          <div className="mt-auto border-t border-border bg-background px-3 py-2">
            <FinancialSummary isReadOnly={isReadOnly} />
            <PaymentSelector isReadOnly={isReadOnly} />
            <ActionFooter
              onSaveOrder={controller.handleOpenOrder}
              onFinalizeSale={controller.handleFinalizeSale}
              isPending={isPending}
              isOrderPending={isOrderPending}
              isUpsertPending={isUpsertPending}
              saleId={saleId}
              isReadOnly={isReadOnly}
              isPendingSale={isPendingSale}
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
              isReadOnly={isReadOnly}
            />
            <CartTable 
              fields={fields}
              remove={remove}
              update={update}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DesktopSaleView;

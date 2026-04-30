"use client";

import { SaleDto } from "@/app/_data-access/sale/get-sales";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";
import { useState } from "react";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Calendar, ShoppingBag, User, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/app/_helpers/currency";
import { cn } from "@/app/_lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sheet } from "@/app/_components/ui/sheet";
import UpsertSheetContent from "./upsert-sheet-content";
import { Button } from "@/app/_components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTablePagination } from "@/app/_components/ui/data-table-pagination";

interface ClosedSalesGridProps {
  sales: SaleDto[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  companyId: string;
  products: ProductDto[];
  productOptions: ComboboxOption[];
  customerOptions: ComboboxOption[];
  stages: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

export const ClosedSalesGrid = ({
  sales,
  total,
  page,
  pageSize,
  search,
  companyId,
  products,
  productOptions,
  customerOptions,
  stages,
  categories,
}: ClosedSalesGridProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSale, setSelectedSale] = useState<SaleDto | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const filteredSales = sales.filter(
    (s) =>
      (s.customerName?.toLowerCase() || "venda balcão").includes(search.toLowerCase()) ||
      (s.productNames?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  const handleOpenSale = (sale: SaleDto) => {
    setSelectedSale(sale);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {filteredSales.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSales.map((sale) => (
            <Card
              key={sale.id}
              onClick={() => handleOpenSale(sale)}
              className="group relative cursor-pointer overflow-hidden border-border bg-background transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            >
              <div className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600">
                        <User size={16} />
                      </div>
                      <h3 className="line-clamp-1 text-sm font-black uppercase italic tracking-tighter text-foreground">
                        {sale.customerName || "Venda Balcão"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      <Calendar size={12} />
                      {format(new Date(sale.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                  >
                    <CheckCircle2 size={10} />
                    Finalizada
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                      <ShoppingBag size={12} />
                      Itens
                    </span>
                    <p className="text-xs font-bold text-muted-foreground line-clamp-1">
                      {sale.productNames}
                    </p>
                  </div>

                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                      Total Pago
                    </span>
                    <p className="text-lg font-black tracking-tighter text-emerald-600">
                      {formatCurrency(sale.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/30 text-center">
          <div className="mb-4 rounded-full bg-muted p-6 text-muted-foreground">
            <ShoppingBag size={48} />
          </div>
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-muted-foreground">
            {search ? "Nenhum resultado" : "Sem Vendas Fechadas"}
          </h3>
          <p className="mt-1 max-w-[300px] text-xs font-bold leading-relaxed text-muted-foreground/80">
            {search
              ? "Experimente mudar o período ou o termo de busca."
              : "As vendas finalizadas aparecerão aqui conforme o período selecionado."}
          </p>
        </div>
      )}
      
      <DataTablePagination 
        total={total} 
        page={page} 
        pageSize={pageSize} 
      />

      {/* Edit/View Sheet for Closed Sales */}
      <Sheet 
        open={isSheetOpen} 
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setSelectedSale(null);
        }}
      >
        {selectedSale && (
          <UpsertSheetContent
            saleId={selectedSale.id}
            saleDate={selectedSale.date}
            customerId={selectedSale.customerId}
            paymentMethod={selectedSale.paymentMethod}
            tipAmount={Number(selectedSale.tipAmount)}
            defaultDiscountAmount={Number(selectedSale.discountAmount || 0)}
            defaultExtraAmount={Number(selectedSale.extraAmount || 0)}
            defaultAdjustmentReason={selectedSale.adjustmentReason || ""}
            defaultIsEmployeeSale={selectedSale.isEmployeeSale || false}
            isOpen={isSheetOpen}
            productOptions={productOptions}
            customerOptions={customerOptions}
            products={products}
            setSheetIsOpen={setIsSheetOpen}
            companyId={companyId}
            stages={stages}
            categories={categories}
            isReadOnly={true}
            defaultSelectedProducts={selectedSale.saleItems.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              return {
                productId: item.productId,
                quantity: Number(item.quantity),
                name: item.product.name,
                price: Number(item.unitPrice),
                cost: Number(item.baseCost || 0),
                operationalCost: Number(item.operationalCost || 0),
                stock: product?.stock ?? 0,
              };
            })}
          />
        )}
      </Sheet>
    </div>
  );
};

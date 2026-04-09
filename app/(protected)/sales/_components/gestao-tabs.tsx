"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Input } from "@/app/_components/ui/input";
import { Search } from "lucide-react";
import { PeriodFilter } from "@/app/_components/period-filter";
import { ComandasGrid } from "./comandas-grid";
import { ClosedSalesGrid } from "./closed-sales-grid";
import { ComandaDto } from "@/app/_data-access/order/get-active-comandas";
import { SaleDto } from "@/app/_data-access/sale/get-sales";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";

interface GestaoTabsProps {
  initialComandas: ComandaDto[];
  initialClosedSales: SaleDto[];
  totalClosedSales: number;
  currentClosedPage: number;
  currentClosedPageSize: number;
  companyId: string;
  products: ProductDto[];
  productOptions: ComboboxOption[];
  customerOptions: ComboboxOption[];
  stages: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

export const GestaoTabs = ({
  initialComandas,
  initialClosedSales,
  totalClosedSales,
  currentClosedPage,
  currentClosedPageSize,
  companyId,
  products,
  productOptions,
  customerOptions,
  stages,
  categories,
}: GestaoTabsProps) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("abertas");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
            <TabsList className="bg-muted/50 p-1 rounded-2xl h-12">
              <TabsTrigger 
                value="abertas" 
                className="rounded-xl px-6 font-black uppercase italic tracking-tighter data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                Abertas
              </TabsTrigger>
              <TabsTrigger 
                value="fechadas"
                className="rounded-xl px-6 font-black uppercase italic tracking-tighter data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
              >
                Fechadas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou celular..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-2xl border-border bg-muted/50 pl-10 font-bold transition-all placeholder:font-medium placeholder:text-muted-foreground focus:bg-background"
            />
          </div>
        </div>

        {activeTab === "fechadas" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <PeriodFilter defaultRange="" hidePresets={true} />
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="abertas" className="mt-0 ring-0 focus-visible:ring-0">
          <ComandasGrid
            initialComandas={initialComandas}
            companyId={companyId}
            products={products}
            productOptions={productOptions}
            stages={stages}
            categories={categories}
            search={search}
          />
        </TabsContent>
        <TabsContent value="fechadas" className="mt-0 ring-0 focus-visible:ring-0">
          <ClosedSalesGrid
            sales={initialClosedSales}
            total={totalClosedSales}
            page={currentClosedPage}
            pageSize={currentClosedPageSize}
            search={search}
            companyId={companyId}
            products={products}
            productOptions={productOptions}
            customerOptions={customerOptions}
            stages={stages}
            categories={categories}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

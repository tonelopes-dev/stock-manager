"use client";

import { ComandaDto } from "@/app/_data-access/order/get-active-comandas";
import { ComandaCard } from "./comanda-card";
import { useState, useEffect, useCallback, Suspense } from "react";
import { RefreshCcw, Search, ShoppingBag } from "lucide-react";
import { useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { useRouter } from "next/navigation";
import { ComandaDetailsSheet } from "./comanda-details-sheet";

import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";

interface ComandasGridProps {
  initialComandas: ComandaDto[];
  companyId: string;
  products: ProductDto[];
  productOptions: ComboboxOption[];
}

export const ComandasGrid = ({
  initialComandas,
  companyId,
  products,
  productOptions,
}: ComandasGridProps) => {
  const [comandas, setComandas] = useState<ComandaDto[]>(initialComandas);
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<ComandaDto | null>(
    null,
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync with initialComandas
  useEffect(() => {
    setComandas(initialComandas);

    // Update selectedComanda if it exists to reflect fresh data from the server
    if (selectedComanda) {
      const updatedSelection = initialComandas.find(
        (c) => c.customerId === selectedComanda.customerId,
      );
      if (updatedSelection) {
        setSelectedComanda(updatedSelection);
      } else {
        // Close the sheet if the comanda is no longer active (e.g., paid in another session)
        setSelectedComanda(null);
      }
    }
  }, [initialComandas, selectedComanda?.customerId]); // Added selectedComanda?.customerId as dependency for safety, though initialComandas is the main trigger

  // Real-time Updates via SSE
  useEffect(() => {
    // We use the central KDS events endpoint
    const eventSource = new EventSource(
      `/api/kds/events?companyId=${companyId}`,
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // If the event belongs to this company, refresh the data
      if (data.companyId === companyId) {
        router.refresh();
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Connection Error:", error);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [companyId, router]);

  // Deep Link Search Handler
  useEffect(() => {
    const action = searchParams.get("action");
    const customerId = searchParams.get("customerId");

    if (action === "open-comanda" && customerId) {
      const comanda = initialComandas.find((c) => c.customerId === customerId);
      if (comanda) {
        setSelectedComanda(comanda);
      }
    }
  }, [searchParams, initialComandas]);

  const handleCloseSheet = () => {
    setSelectedComanda(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("action");
    params.delete("customerId");
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  const filteredComandas = comandas.filter(
    (c) =>
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerPhone?.includes(search),
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    // Simulate a bit of loading for UX feedback if refresh is too fast
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-6">
      {/* Header Operational Actions */}
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou celular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 rounded-2xl border-border bg-muted/50 pl-10 font-bold transition-all placeholder:font-medium placeholder:text-muted-foreground focus:bg-background"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="h-12 gap-2 rounded-2xl border-border px-6 font-black uppercase italic tracking-tighter transition-colors hover:bg-muted"
          disabled={isRefreshing}
        >
          <RefreshCcw
            className={cn(
              "h-4 w-4 text-primary",
              isRefreshing && "animate-spin",
            )}
          />
          {isRefreshing ? "Atualizando..." : "Atualizar Painel"}
        </Button>
      </div>

      {/* Grid of Comandas */}
      {filteredComandas.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredComandas.map((comanda) => (
            <ComandaCard
              key={comanda.customerId}
              comanda={comanda}
              onClick={() => setSelectedComanda(comanda)}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/30 text-center">
          <div className="mb-4 rounded-full bg-muted p-6 text-muted-foreground">
            <ShoppingBag size={48} />
          </div>
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-muted-foreground">
            {search ? "Nenhum resultado" : "Aguardando Pedidos"}
          </h3>
          <p className="mt-1 max-w-[300px] text-xs font-bold leading-relaxed text-muted-foreground/80">
            {search
              ? `Não encontramos comandas para "${search}". Verifique se o nome está correto.`
              : "As comandas aparecerão aqui automaticamente assim que um cliente fizer um pedido pelo Menu Digital."}
          </p>
        </div>
      )}

      {/* Comanda Details Sheet */}
      <ComandaDetailsSheet
        comanda={selectedComanda}
        isOpen={!!selectedComanda}
        onClose={handleCloseSheet}
        companyId={companyId}
        products={products}
        productOptions={productOptions}
      />
    </div>
  );
};

// Internal utility
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

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
import { cn } from "@/app/_lib/utils";

interface ComandasGridProps {
  initialComandas: ComandaDto[];
  companyId: string;
  products: ProductDto[];
  productOptions: ComboboxOption[];
  stages: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  search: string;
}

export const ComandasGrid = ({
  initialComandas,
  companyId,
  products,
  productOptions,
  stages,
  categories,
  search,
}: ComandasGridProps) => {
  const [comandas, setComandas] = useState<ComandaDto[]>(initialComandas);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<ComandaDto | null>(
    null,
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

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
  }, [initialComandas, selectedComanda?.customerId]);

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
  
  // Real-time Updates via Resilient SSE
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;

    const connect = () => {
      if (eventSource) eventSource.close();

      eventSource = new EventSource("/api/kds/stream");

      eventSource.onopen = () => {
        retryCount = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          // Refresh on any relevant update (New Order or Status Update)
          if (data.type === "NEW_ORDER" || data.type === "STATUS_UPDATED") {
            router.refresh();
          }
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        retryTimeout = setTimeout(() => {
          retryCount++;
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [router]);

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
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (Refresh only, Search is handled by parent) */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="h-10 gap-2 rounded-2xl border-border px-6 font-black uppercase italic tracking-tighter transition-colors hover:bg-muted"
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
        stages={stages}
        categories={categories}
      />
    </div>
  );
};

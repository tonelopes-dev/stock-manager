"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/app/_components/ui/command";
import {
  Users,
  Package,
  ShoppingBasket,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  globalSearch,
  SearchResult,
} from "@/app/_actions/search/global-search";

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await globalSearch(query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");
      router.push(result.href);
    },
    [router],
  );

  // Shortcuts
  const handleShortcut = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      router.push(path);
    },
    [router],
  );

  const customers = results.filter((r) => r.type === "customer");
  const products = results.filter((r) => r.type === "product");
  const sales = results.filter((r) => r.type === "sale");

  const typeIcons = {
    customer: <Users className="h-4 w-4 text-primary" />,
    product: <Package className="h-4 w-4 text-emerald-500" />,
    sale: <ShoppingBasket className="h-4 w-4 text-primary" />,
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-72 items-center gap-2 rounded-xl border border-border/80 bg-muted/80 px-3 text-sm text-muted-foreground shadow-inner transition-all hover:border-border hover:bg-background hover:shadow-sm"
      >
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="flex-1 text-left text-xs">Buscar em tudo...</span>
        <kbd className="pointer-events-none hidden rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground shadow-sm sm:inline-flex">
          Ctrl K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar clientes, produtos, vendas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-slate-600" />
                <span className="text-sm text-muted-foreground">Buscando...</span>
              </div>
            ) : query.length < 2 ? (
              <div className="space-y-4 py-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Atalhos rápidos
                </p>
                <div className="space-y-1">
                  {[
                    { label: "Nova Venda", path: "/sales", shortcut: "/venda" },
                    {
                      label: "Novo Cliente",
                      path: "/customers",
                      shortcut: "/cliente",
                    },
                    {
                      label: "Monitor da Cozinha",
                      path: "/kds",
                      shortcut: "/kds",
                    },
                  ].map((s) => (
                    <button
                      key={s.path}
                      onClick={() => handleShortcut(s.path)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">
                        {s.label}
                      </span>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {s.shortcut}
                      </code>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              "Nenhum resultado encontrado."
            )}
          </CommandEmpty>

          {customers.length > 0 && (
            <CommandGroup heading="Clientes">
              {customers.map((r) => (
                <CommandItem
                  key={r.id}
                  value={r.title}
                  onSelect={() => handleSelect(r)}
                  className="flex items-center gap-3"
                >
                  {typeIcons[r.type]}
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-semibold">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{r.subtitle}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {products.length > 0 && (
            <>
              {customers.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Produtos">
                {products.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={r.title}
                    onSelect={() => handleSelect(r)}
                    className="flex items-center gap-3"
                  >
                    {typeIcons[r.type]}
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold">{r.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.subtitle}
                      </span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {sales.length > 0 && (
            <>
              {(customers.length > 0 || products.length > 0) && (
                <CommandSeparator />
              )}
              <CommandGroup heading="Vendas">
                {sales.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={r.title}
                    onSelect={() => handleSelect(r)}
                    className="flex items-center gap-3"
                  >
                    {typeIcons[r.type]}
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold">{r.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.subtitle}
                      </span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

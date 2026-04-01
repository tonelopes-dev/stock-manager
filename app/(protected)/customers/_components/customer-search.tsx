"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/app/_components/ui/input";
import { SearchIcon, XIcon, Users, ArrowRight, Loader2 } from "lucide-react";
import { TransitionStartFunction, useEffect, useState, useCallback, ChangeEvent } from "react";
import { useDebounce } from "use-debounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/app/_components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { globalSearch, SearchResult } from "@/app/_actions/search/global-search";

interface CustomerSearchProps {
  startTransition: TransitionStartFunction;
  isPending: boolean;
}

export const CustomerSearch = ({
  startTransition,
  isPending,
}: CustomerSearchProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState(searchParams.get("search") || "");
  const [query] = useDebounce(text, 300);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Sync URL search param
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    if (query === currentSearch) return;

    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }

    startTransition(() => {
      router.push(`/customers?${params.toString()}`, { scroll: false });
    });
  }, [query, router, searchParams, startTransition]);

  // Fetch suggestions
  useEffect(() => {
    if (!text || text.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const results = await globalSearch(text);
        // Filter only customers for this local search
        setSuggestions(results.filter((r) => r.type === "customer"));
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [text]);

  const handleSelect = useCallback((result: SearchResult) => {
    setOpen(false);
    setText("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("customerId", result.id);
    params.set("action", "open-modal");
    router.push(`/customers?${params.toString()}`);
  }, [router, searchParams]);

  /* Removed sync effect that was causing loops. Input state is now primarily controlled by the user. */

  return (
    <div className="relative w-[300px]">
      <Popover open={open && text.length >= 2} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar no CRM..."
              className="pl-9 pr-9"
              value={text}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setText(e.target.value);
                setOpen(true);
              }}
              onFocus={() => text.length >= 2 && setOpen(true)}
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              {isLoading || isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                text && (
                  <button
                    onClick={() => {
                      setText("");
                      setOpen(false);
                    }}
                    className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    type="button"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                )
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[300px] p-0 shadow-2xl border-none bg-card/95 backdrop-blur-md" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="bg-transparent">
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
                {isLoading ? "Buscando clientes..." : "Nenhum cliente encontrado."}
              </CommandEmpty>
              {suggestions.length > 0 && (
                <CommandGroup heading="Clientes">
                  {suggestions.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => handleSelect(result)}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-accent/50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <span className="truncate text-sm font-bold tracking-tight">
                          {result.title}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {result.subtitle}
                        </span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

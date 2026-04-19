"use client";

import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { SearchIcon, FilterIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Button } from "@/app/_components/ui/button";
import { Label } from "@/app/_components/ui/label";

interface StockFiltersProps {
  suppliers: { id: string; name: string }[];
}

const StockFilters = ({ suppliers }: StockFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for immediate UI feedback
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [debouncedSearchValue] = useDebounce(searchValue, 500);

  const currentSupplier = searchParams.get("supplierId") || "all";
  const currentStockStatus = searchParams.get("stockStatus") || "all";
  const currentStatus = searchParams.get("status") || "ACTIVE";

  // Update URL when debounced search changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    // Guard: Only push if the value actually changed
    if (debouncedSearchValue !== currentSearch) {
      if (debouncedSearchValue) {
        params.set("search", debouncedSearchValue);
      } else {
        params.delete("search");
      }
      params.set("page", "1"); // Reset to page 1 on filter change
      
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    }
  }, [debouncedSearchValue, router, searchParams]);

  const handleSelectChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };


  return (
    <div className="flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/60 shadow-inner">
      <div className="relative flex-1 min-w-[240px]">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input
          placeholder="Buscar por nome do produto..."
          className="pl-12 rounded-2xl border-none bg-white shadow-sm h-12"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Select value={currentSupplier} onValueChange={(v) => handleSelectChange("supplierId", v)}>
          <SelectTrigger className="w-[200px] rounded-2xl border-none bg-white shadow-sm h-12">
            <div className="flex items-center gap-2">
              <FilterIcon size={14} className="text-slate-400" />
              <SelectValue placeholder="Fornecedor" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-xl">
            <SelectItem value="all">Todos Fornecedores</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentStockStatus} onValueChange={(v) => handleSelectChange("stockStatus", v)}>
          <SelectTrigger className="w-[180px] rounded-2xl border-none bg-white shadow-sm h-12">
            <SelectValue placeholder="Estoque" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-xl">
            <SelectItem value="all">Todos Níveis</SelectItem>
            <SelectItem value="LOW_STOCK">Estoque Baixo</SelectItem>
            <SelectItem value="EXPIRING">Vencendo Logo</SelectItem>
            <SelectItem value="OUT_OF_STOCK">Sem Estoque</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentStatus} onValueChange={(v) => handleSelectChange("status", v)}>
          <SelectTrigger className="w-[180px] rounded-2xl border-none bg-white shadow-sm h-12">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-xl">
            <SelectItem value="ACTIVE">Ativos</SelectItem>
            <SelectItem value="INACTIVE">Inativos</SelectItem>
            <SelectItem value="ALL">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default StockFilters;

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/app/_components/ui/input";
import { SearchIcon, XIcon } from "lucide-react";
import { useTransition, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export const CustomerSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState(searchParams.get("search") || "");
  const [query] = useDebounce(text, 500);
  const [isPending, startTransition] = useTransition();

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
  }, [query, router, searchParams]);

  return (
    <div className="relative w-[300px]">
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar por nome ou telefone..."
        className="pl-9 pr-9"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {isPending ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          text && (
            <button
              onClick={() => setText("")}
              className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
              type="button"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )
        )}
      </div>
    </div>
  );
};

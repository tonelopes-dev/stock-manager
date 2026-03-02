"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/app/_components/ui/input";
import { SearchIcon } from "lucide-react";
import { useTransition, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export const CustomerSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState(searchParams.get("search") || "");
  const [query] = useDebounce(text, 500);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }

    startTransition(() => {
      router.push(`/customers?${params.toString()}`);
    });
  }, [query, router, searchParams]);

  return (
    <div className="relative w-[300px]">
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar por nome ou telefone..."
        className="pl-9"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
};

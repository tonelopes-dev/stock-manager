"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { format, parseISO } from "date-fns";

export const DateRangePicker = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from current URL params
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  const handleApply = () => {
    if (!from || !to) return;

    const params = new URLSearchParams();
    params.set("range", "custom");
    params.set("from", from);
    params.set("to", to);

    router.push(`/dashboard?${params.toString()}`);
  };

  const handleClear = () => {
    setFrom("");
    setTo("");
    router.push("/dashboard");
  };

  const isActive = searchParams.get("range") === "custom";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:border-primary/30">
        <div className="flex items-center px-3 border-r border-border bg-slate-50/50">
          <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mr-2">DE</span>
          <DatePicker
            value={from ? parseISO(from) : undefined}
            onChange={(date) => setFrom(date ? format(date, "yyyy-MM-dd") : "")}
            className="h-9 w-[180px] border-none bg-transparent shadow-none hover:bg-transparent focus-visible:ring-0"
            placeholder="Data inicial"
          />
        </div>
        <div className="flex items-center px-3">
          <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mr-2">ATÉ</span>
          <DatePicker
            value={to ? parseISO(to) : undefined}
            onChange={(date) => setTo(date ? format(date, "yyyy-MM-dd") : "")}
            className="h-9 w-[180px] border-none bg-transparent shadow-none hover:bg-transparent focus-visible:ring-0"
            placeholder="Data final"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleApply}
          disabled={!from || !to}
          className="
            h-9 px-6 rounded-xl
            text-[11px] font-black uppercase tracking-wider
            bg-primary text-background
            transition-all duration-200
            hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20
            disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-[0.97]
          "
        >
          Aplicar
        </button>

        {isActive && (
          <button
            onClick={handleClear}
            className="
              h-9 px-4 rounded-xl
              text-[11px] font-black uppercase tracking-wider
              text-muted-foreground border border-border bg-white
              transition-all duration-200
              hover:bg-slate-50
              active:scale-[0.97]
            "
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
};

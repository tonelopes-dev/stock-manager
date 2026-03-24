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
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label
          htmlFor="date-from"
          className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          De
        </label>
        <DatePicker
          value={from ? parseISO(from) : undefined}
          onChange={(date) => setFrom(date ? format(date, "yyyy-MM-dd") : "")}
          className="h-9 w-40"
        />
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor="date-to"
          className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          Até
        </label>
        <DatePicker
          value={to ? parseISO(to) : undefined}
          onChange={(date) => setTo(date ? format(date, "yyyy-MM-dd") : "")}
          className="h-9 w-40"
        />
      </div>

      <button
        onClick={handleApply}
        disabled={!from || !to}
        className="
          h-9 px-4 rounded-lg
          text-xs font-bold uppercase tracking-widest
          bg-primary text-background
          transition-all duration-200
          hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
          active:scale-[0.97]
        "
      >
        Aplicar
      </button>

      {isActive && (
        <button
          onClick={handleClear}
          className="
            h-9 px-3 rounded-lg
            text-xs font-bold uppercase tracking-widest
            text-muted-foreground border border-border
            transition-all duration-200
            hover:bg-muted hover:border-border
            active:scale-[0.97]
          "
        >
          Limpar
        </button>
      )}
    </div>
  );
};

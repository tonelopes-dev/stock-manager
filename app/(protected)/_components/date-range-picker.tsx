"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
          className="text-[11px] font-bold uppercase tracking-widest text-slate-400"
        >
          De
        </label>
        <input
          id="date-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="
            h-9 rounded-lg border border-slate-200 bg-white px-3
            text-sm font-medium text-slate-700
            outline-none transition-all
            focus:border-primary/40 focus:ring-2 focus:ring-primary/10
            hover:border-slate-300
          "
        />
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor="date-to"
          className="text-[11px] font-bold uppercase tracking-widest text-slate-400"
        >
          Até
        </label>
        <input
          id="date-to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="
            h-9 rounded-lg border border-slate-200 bg-white px-3
            text-sm font-medium text-slate-700
            outline-none transition-all
            focus:border-primary/40 focus:ring-2 focus:ring-primary/10
            hover:border-slate-300
          "
        />
      </div>

      <button
        onClick={handleApply}
        disabled={!from || !to}
        className="
          h-9 px-4 rounded-lg
          text-xs font-bold uppercase tracking-widest
          bg-primary text-white
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
            text-slate-500 border border-slate-200
            transition-all duration-200
            hover:bg-slate-50 hover:border-slate-300
            active:scale-[0.97]
          "
        >
          Limpar
        </button>
      )}
    </div>
  );
};

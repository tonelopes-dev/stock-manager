"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { cn } from "@/app/_lib/utils";

const filters = [
  { label: "Hoje", value: "today" },
  { label: "7 Dias", value: "7d" },
  { label: "14 Dias", value: "14d" },
  { label: "30 Dias", value: "30d" },
  { label: "Este Mês", value: "month" },
];

export const PeriodFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") || "7d";

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    
    // Calculate dates for 'from' and 'to' to keep it consistent across the app
    const now = new Date();
    let fromDate: Date | null = null;
    
    if (value === "today") {
        fromDate = new Date();
    } else if (value === "7d") {
        fromDate = new Date(now.setDate(now.getDate() - 7));
    } else if (value === "14d") {
        fromDate = new Date(now.setDate(now.getDate() - 14));
    } else if (value === "30d") {
        fromDate = new Date(now.setDate(now.getDate() - 30));
    } else if (value === "month") {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (fromDate) {
        params.set("from", fromDate.toISOString().split('T')[0]);
        params.set("to", new Date().toISOString().split('T')[0]);
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200 shadow-sm w-fit">
      <div className="flex items-center gap-1.5 px-3 border-r border-slate-200 mr-1">
          <ClockIcon size={14} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ver</span>
      </div>
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentRange === filter.value ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "h-7 px-3 font-bold text-[11px] rounded-md transition-all",
            currentRange === filter.value 
              ? "bg-slate-100 text-primary" 
              : "text-slate-500 hover:text-slate-900"
          )}
          onClick={() => handleRangeChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 px-2 text-slate-300 hover:text-slate-600 rounded-md"
        disabled
      >
        <CalendarIcon size={14} />
      </Button>
    </div>
  );
};

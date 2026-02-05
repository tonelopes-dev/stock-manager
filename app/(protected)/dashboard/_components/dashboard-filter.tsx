"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { cn } from "@/app/_lib/utils";

const filters = [
  { label: "7 Dias", value: "7d" },
  { label: "14 Dias", value: "14d" },
  { label: "30 Dias", value: "30d" },
  { label: "Este Mês", value: "month" },
];

export const DashboardFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") || "7d";

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-xl border border-slate-200/60 w-fit">
      <div className="flex items-center gap-1.5 px-3 border-r border-slate-200 mr-1.5">
          <ClockIcon size={14} className="text-slate-400" />
          <span className="text-[11px] font-black uppercase tracking-tighter text-slate-500">Período</span>
      </div>
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentRange === filter.value ? "default" : "ghost"}
          size="sm"
          className={cn(
            "h-8 px-4 font-bold text-xs rounded-lg transition-all",
            currentRange === filter.value 
              ? "shadow-sm" 
              : "text-slate-500 hover:text-slate-900 hover:bg-white"
          )}
          onClick={() => handleRangeChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 px-3 text-slate-400 hover:text-slate-600 rounded-lg"
        disabled
      >
        <CalendarIcon size={14} className="mr-2" />
        <span className="text-xs font-bold">Personalizado</span>
      </Button>
    </div>
  );
};

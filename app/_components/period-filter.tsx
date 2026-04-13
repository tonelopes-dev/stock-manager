"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { cn } from "@/app/_lib/utils";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/app/_components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";

const filters = [
  { label: "Hoje", value: "today" },
  { label: "7 Dias", value: "7d" },
  { label: "14 Dias", value: "14d" },
  { label: "30 Dias", value: "30d" },
  { label: "Este Mês", value: "month" },
];

interface PeriodFilterProps {
  defaultRange?: string;
  hidePresets?: boolean;
}

export const PeriodFilter = ({ 
  defaultRange = "today",
  hidePresets = false 
}: PeriodFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") || defaultRange;
  const [isOpen, setIsOpen] = useState(false);

  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const [date, setDate] = useState<DateRange | undefined>(() => {
    if (fromStr && toStr) {
      return {
        from: parseISO(fromStr),
        to: parseISO(toStr),
      };
    }
    return undefined;
  });

  // Keep internal state in sync with URL
  useEffect(() => {
    if (fromStr && toStr) {
      setDate({
        from: parseISO(fromStr),
        to: parseISO(toStr),
      });
    }
  }, [fromStr, toStr]);

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    
    // Calculate dates for 'from' and 'to' to keep it consistent across the app
    const now = new Date();
    let fromDate: Date | null = null;
    let toDate: Date = new Date();
    
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
        params.set("from", format(fromDate, "yyyy-MM-dd"));
        params.set("to", format(toDate, "yyyy-MM-dd"));
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleApply = () => {
    if (date?.from && date?.to) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", "custom");
      params.set("from", format(date.from, "yyyy-MM-dd"));
      params.set("to", format(date.to, "yyyy-MM-dd"));
      
      router.push(`?${params.toString()}`, { scroll: false });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setDate(undefined);
  };

  return (
    <div className={cn(
      "flex items-center gap-1 p-1 bg-background rounded-lg border border-border shadow-sm w-fit",
      hidePresets && "border-none shadow-none p-0"
    )}>
      {!hidePresets && (
        <>
          <div className="flex items-center gap-1.5 px-3 border-r border-border mr-1">
              <ClockIcon size={14} className="text-muted-foreground" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ver</span>
          </div>
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={currentRange === filter.value ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-7 px-3 font-bold text-[11px] rounded-md transition-all",
                currentRange === filter.value 
                  ? "bg-muted text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleRangeChange(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-7 px-2 text-muted-foreground hover:text-foreground rounded-md gap-2 transition-all duration-200",
              (currentRange === "custom" || fromStr) && "bg-muted text-primary font-bold",
              hidePresets && "h-12 px-6 rounded-2xl bg-muted/50 border border-border hover:bg-muted font-bold text-sm text-foreground shadow-sm hover:shadow-md"
            )}
          >
            <CalendarIcon size={hidePresets ? 18 : 14} className={cn(
               "text-muted-foreground",
               (currentRange === "custom" || fromStr) && "text-primary"
            )} />
            <span className={cn(
                "whitespace-nowrap",
                hidePresets ? "text-xs uppercase font-black italic tracking-tighter" : "text-[10px] font-bold"
            )}>
              {date?.from ? (
                <span className="flex items-center gap-1.5">
                  {!hidePresets && <span className="opacity-70">Período:</span>}
                  {format(date.from, "dd/MM", { locale: ptBR })} 
                  <span className="opacity-40">-</span> 
                  {date.to ? format(date.to, "dd/MM", { locale: ptBR }) : "..."}
                </span>
              ) : (
                hidePresets ? "Filtrar por Período" : "Selecione uma Data"
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-border" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
            locale={ptBR}
            className="rounded-t-xl border-none"
          />
          <div className="p-3 border-t border-border flex items-center justify-between bg-muted/20">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClear}
                className="text-[11px] font-bold h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
                Limpar
            </Button>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsOpen(false)}
                    className="text-[11px] font-bold h-8"
                >
                    Cancelar
                </Button>
                <Button 
                    size="sm" 
                    onClick={handleApply}
                    disabled={!date?.from || !date?.to}
                    className="text-[11px] font-bold h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                    Filtrar
                </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};


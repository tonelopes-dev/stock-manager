"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format, startOfYear, eachMonthOfInterval, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Label } from "@/app/_components/ui/label";

export function MonthComparisonFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Current values from URL or defaults
  const now = new Date();
  const currentMonthA = searchParams.get("monthA") || format(now, "yyyy-MM");
  const currentMonthB = searchParams.get("monthB") || format(new Date(now.getFullYear(), now.getMonth() - 1), "yyyy-MM");

  const [yearA, monthA] = currentMonthA.split("-");
  const [yearB, monthB] = currentMonthB.split("-");

  // Generate Year options (Last 5 years)
  const years = Array.from({ length: 5 }).map((_, i) => (now.getFullYear() - i).toString());

  // Generate Month options
  const months = eachMonthOfInterval({
    start: startOfYear(now),
    end: endOfYear(now),
  }).map((date) => ({
    value: format(date, "MM"),
    label: format(date, "MMMM", { locale: ptBR }),
  }));

  const handleUpdate = (period: "A" | "B", type: "year" | "month", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (period === "A") {
      const newMonthA = type === "year" ? `${value}-${monthA}` : `${yearA}-${value}`;
      params.set("monthA", newMonthA);
    } else {
      const newMonthB = type === "year" ? `${value}-${monthB}` : `${yearB}-${value}`;
      params.set("monthB", newMonthB);
    }
    
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-6 bg-white p-1.5 px-4 rounded-xl border border-slate-200 shadow-sm">
      {/* PERIOD A */}
      <div className="flex items-center gap-3">
        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Período A</Label>
        <div className="flex gap-1.5">
          <Select value={yearA} onValueChange={(v) => handleUpdate("A", "year", v)}>
            <SelectTrigger className="h-8 w-[80px] text-xs font-bold bg-slate-50 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={monthA} onValueChange={(v) => handleUpdate("A", "month", v)}>
            <SelectTrigger className="h-8 w-[110px] text-xs font-bold bg-slate-50 border-slate-200 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => <SelectItem key={m.value} value={m.value} className="text-xs capitalize">{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-[10px] font-black text-slate-300 italic">VS</div>

      {/* PERIOD B */}
      <div className="flex items-center gap-3">
        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Período B</Label>
        <div className="flex gap-1.5">
          <Select value={yearB} onValueChange={(v) => handleUpdate("B", "year", v)}>
            <SelectTrigger className="h-8 w-[80px] text-xs font-bold bg-slate-50 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={monthB} onValueChange={(v) => handleUpdate("B", "month", v)}>
            <SelectTrigger className="h-8 w-[110px] text-xs font-bold bg-slate-50 border-slate-200 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => <SelectItem key={m.value} value={m.value} className="text-xs capitalize">{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format, subMonths } from "date-fns";
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

  const monthA = searchParams.get("monthA") || format(new Date(), "yyyy-MM");
  const monthB = searchParams.get("monthB") || format(subMonths(new Date(), 1), "yyyy-MM");

  // Generate last 12 months as options
  const months = Array.from({ length: 12 }).map((_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: ptBR }),
    };
  });

  const handleUpdate = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
      <div className="flex items-center gap-2">
        <Label className="text-[10px] font-black uppercase text-slate-400">Comparar</Label>
        <Select value={monthA} onValueChange={(v) => handleUpdate("monthA", v)}>
          <SelectTrigger className="h-8 w-[140px] text-xs font-bold border-none bg-white shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-[10px] font-black text-slate-300">VS</div>

      <div className="flex items-center gap-2">
        <Select value={monthB} onValueChange={(v) => handleUpdate("monthB", v)}>
          <SelectTrigger className="h-8 w-[140px] text-xs font-bold border-none bg-white shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

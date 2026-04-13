"use client";

import { useFormContext } from "react-hook-form";
import { UsersIcon, CheckIcon } from "lucide-react";
import { Combobox, ComboboxOption } from "@/app/_components/ui/combobox";
import { Badge } from "@/app/_components/ui/badge";
import { cn } from "@/app/_lib/utils";

interface CustomerSectionProps {
  customerOptions: ComboboxOption[];
  categories: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  isReadOnly?: boolean;
}

export const CustomerSection = ({
  customerOptions,
  isReadOnly = false,
}: CustomerSectionProps) => {
  const { watch, setValue } = useFormContext();
  const customerId = watch("customerId");

  return (
    <div className="space-y-4 rounded-xl border border-border/40 bg-background/50 p-3 shadow-sm transition-all hover:shadow-md">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/80">
            <div className="rounded-md bg-primary/10 p-1">
              <UsersIcon size={12} className="text-primary" />
            </div>
            Cliente
          </label>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Combobox
              options={customerOptions}
              value={customerId || ""}
              onChange={(val) => setValue("customerId", val)}
              placeholder="Selecione o Cliente..."
              className="h-10 text-xs font-bold"
              disabled={isReadOnly}
            />
          </div>

          <Badge
            variant={customerId ? "outline" : "secondary"}
            className={cn(
              "h-10 gap-1.5 whitespace-nowrap px-2.5 py-1 text-[10px] font-black uppercase tracking-tight transition-all active:scale-95",
              !customerId
                ? "border-emerald-500/20 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                : "border-border/50 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              isReadOnly && "pointer-events-none opacity-50"
            )}
            onClick={() => !isReadOnly && setValue("customerId", null)}
          >
            {!customerId && (
              <CheckIcon size={12} className="animate-pulse" />
            )}
            Venda Avulsa {!customerId && "Ativa"}
          </Badge>
        </div>
      </div>
    </div>
  );
};

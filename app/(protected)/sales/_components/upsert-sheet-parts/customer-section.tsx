"use client";

import { useFormContext } from "react-hook-form";
import { UsersIcon, CheckIcon } from "lucide-react";
import { Combobox, ComboboxOption } from "@/app/_components/ui/combobox";
import { Badge } from "@/app/_components/ui/badge";
import { cn } from "@/app/_lib/utils";
import { ExpandableAvatar } from "@/app/_components/expandable-avatar";

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

  const selectedCustomer = customerOptions.find(opt => opt.value === customerId);
  const customerImageUrl = selectedCustomer?.imageUrl;

  return (
    <div className="space-y-4 rounded-xl border border-border/40 bg-background/50 p-3 shadow-sm transition-all hover:shadow-md">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-primary/80">
            <ExpandableAvatar
              imageUrl={customerImageUrl}
              name={selectedCustomer?.label || "Cliente"}
              className="h-11 w-11 rounded-xl border-2"
              iconSize={20}
            />
            Cliente
          </label>
        </div>

        <div className="flex flex-col xl:flex-row gap-2">
          {/* ... existing combobox and badge ... */}
          <div className="flex-1 w-full">
            <Combobox
              options={customerOptions}
              value={customerId || ""}
              onChange={(val) => setValue("customerId", val)}
              placeholder="Selecione o Cliente..."
              className="h-10 text-xs font-bold w-full"
              disabled={isReadOnly}
            />
          </div>

          <Badge
            variant={customerId ? "outline" : "secondary"}
            className={cn(
              "flex justify-center w-full xl:w-auto h-10 gap-1.5 whitespace-nowrap px-2.5 py-1 text-[10px] font-black uppercase tracking-tight transition-all active:scale-95",
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

        {/* Identification & Notes */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">
              Número da Mesa
            </label>
            <input
              type="text"
              placeholder="Ex: 12"
              value={watch("tableNumber") || ""}
              onChange={(e) => setValue("tableNumber", e.target.value)}
              className="flex h-9 w-full rounded-xl border border-border bg-background/50 px-3 py-1 text-xs font-bold placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">
              Obs. Geral
            </label>
            <input
              type="text"
              placeholder="Notas do pedido..."
              value={watch("notes") || ""}
              onChange={(e) => setValue("notes", e.target.value)}
              className="flex h-9 w-full rounded-xl border border-border bg-background/50 px-3 py-1 text-xs font-bold placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

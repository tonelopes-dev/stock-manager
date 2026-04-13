"use client";

import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Switch } from "@/app/_components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";
import { formatCurrency } from "@/app/_helpers/currency";
import { cn } from "@/app/_lib/utils";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useSaleTotals } from "./use-sale-totals";

interface FinancialSummaryProps {
  isReadOnly?: boolean;
}

export const FinancialSummary = ({ isReadOnly = false }: FinancialSummaryProps) => {
  const { watch, setValue } = useFormContext();
  const totals = useSaleTotals();

  const applyServiceCharge = watch("applyServiceCharge");
  const isEmployeeSale = watch("isEmployeeSale");
  const discountAmount = watch("discountAmount");
  const extraAmount = watch("extraAmount");
  const adjustmentReason = watch("adjustmentReason");

  const [adjustmentType, setAdjustmentType] = useState<"discount" | "extra">(
    extraAmount > 0 ? "extra" : "discount",
  );

  return (
    <div className="mt-auto border-t border-border bg-background px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      {/* Toggles */}
      <div className="mb-2 grid grid-cols-2 gap-2 border-b border-border pb-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex cursor-help items-center gap-2 rounded-lg bg-muted/50 p-1.5 transition-colors hover:bg-muted">
              <Switch
                checked={applyServiceCharge}
                onCheckedChange={(val) => setValue("applyServiceCharge", val)}
                id="service-charge"
                className="origin-left scale-75"
                disabled={isReadOnly}
              />
              <div className="flex flex-col">
                <Label
                  htmlFor="service-charge"
                  className="mb-0.5 text-[9px] font-black uppercase leading-none text-muted-foreground"
                >
                  Serviço (10%)
                </Label>
                <span
                  className={cn(
                    "text-[10px] font-bold leading-none transition-colors",
                    applyServiceCharge
                      ? "text-primary"
                      : "text-muted-foreground/30",
                  )}
                >
                  {formatCurrency(totals.serviceChargeAmount)}
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] font-bold uppercase">
            Adiciona 10% de taxa de serviço sobre o total
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex cursor-help items-center gap-2 rounded-lg bg-muted/50 p-1.5 transition-colors hover:bg-muted">
              <Switch
                checked={isEmployeeSale}
                onCheckedChange={(val) => setValue("isEmployeeSale", val)}
                id="employee-sale"
                className="origin-left scale-75"
                disabled={isReadOnly}
              />
              <div className="flex flex-col">
                <Label
                  htmlFor="employee-sale"
                  className="mb-0.5 text-[9px] font-black uppercase leading-none text-muted-foreground"
                >
                  Funcionário
                </Label>
                <span
                  className={cn(
                    "text-[10px] font-bold leading-none transition-colors",
                    isEmployeeSale
                      ? "text-emerald-600"
                      : "text-muted-foreground/30",
                  )}
                >
                  {isEmployeeSale ? "Ativado" : "Desligado"}
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] font-bold uppercase">
            Venda a preço de custo (Base + Op) para equipe
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Real Totals Display */}
      <div className="mb-2 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
            Resumo Financeiro
          </p>
          <p className="text-xs font-bold uppercase tracking-tighter text-foreground">
            {totals.itenCount} itens no total
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
            Total Geral
          </p>
          <h2 className="text-2xl font-black leading-none tracking-tighter text-primary">
            {formatCurrency(totals.totalWithTip)}
          </h2>
        </div>
      </div>

      {/* Adjustment Section */}
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Ajuste Manual
              </Label>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Tabs
                  value={adjustmentType}
                  onValueChange={(val) => {
                    const type = val as "discount" | "extra";
                    setAdjustmentType(type);
                    if (type === "discount") setValue("extraAmount", 0);
                    else setValue("discountAmount", 0);
                  }}
                  className={cn("h-7", isReadOnly && "pointer-events-none opacity-50")}
                >
                  <TabsList className="h-7 bg-muted/50 p-0.5">
                    <TabsTrigger
                      value="discount"
                      className="h-6 text-[10px] font-bold uppercase"
                    >
                      Desconto
                    </TabsTrigger>
                    <TabsTrigger
                      value="extra"
                      className="h-6 text-[10px] font-bold uppercase"
                    >
                      Acréscimo
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="text-[10px] font-bold uppercase"
              >
                Alterne entre conceder desconto ou adicionar um valor extra
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-2">
            <div className="space-y-0.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {adjustmentType === "discount" ? "Valor" : "Acréscimo"}
              </Label>
            </div>
            <div className="relative w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">
                R$
              </span>
              <Input
                type="number"
                min={0}
                placeholder="0,00"
                className="h-8 pl-8 text-xs font-black text-primary"
                disabled={isReadOnly}
                value={
                  adjustmentType === "discount"
                    ? discountAmount || ""
                    : extraAmount || ""
                }
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  const amount = isNaN(val) ? 0 : Math.max(0, val);
                  if (adjustmentType === "discount") {
                    setValue("discountAmount", amount);
                  } else {
                    setValue("extraAmount", amount);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {(discountAmount > 0 || extraAmount > 0) && (
          <div className="space-y-1.5 border-t border-border pt-2">
            <Input
              placeholder="Justificativa..."
              className="h-7 text-[10px] italic"
              disabled={isReadOnly}
              value={adjustmentReason}
              onChange={(e) => setValue("adjustmentReason", e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

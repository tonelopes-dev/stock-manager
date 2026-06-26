"use client";

import { ComandaDto } from "@/app/_data-access/order/get-active-comandas";
import { Button } from "@/app/_components/ui/button";
import { formatCurrency } from "@/app/_utils/currency";
import { ComboboxOption, Combobox } from "@/app/_components/ui/combobox";
import {
  Clock,
  Smartphone,
  CreditCard,
  DollarSign,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { cn } from "@/app/_lib/utils";
import { Label } from "@/app/_components/ui/label";
import { Input } from "@/app/_components/ui/input";
import { Switch } from "@/app/_components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ComandaTotals } from "./use-comanda-state";

// ── Payment Method Config ────────────────────────────────────────────────

const paymentMethodLabels: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  PIX: { label: "PIX", icon: <Smartphone className="h-3.5 w-3.5" /> },
  CASH: { label: "Dinheiro", icon: <DollarSign className="h-3.5 w-3.5" /> },
  CREDIT_CARD: {
    label: "Crédito",
    icon: <CreditCard className="h-3.5 w-3.5" />,
  },
  DEBIT_CARD: { label: "Débito", icon: <CreditCard className="h-3.5 w-3.5" /> },
  OTHER: { label: "Outro", icon: <Wallet className="h-3.5 w-3.5" /> },
  PENDING_PAYMENT: { label: "Pagar Depois (VIP)", icon: <Clock className="h-3.5 w-3.5 text-orange-500" /> },
};

// ── Props ────────────────────────────────────────────────────────────────

interface ComandaPaymentSectionProps {
  comanda: ComandaDto;
  totals: ComandaTotals;
  isPartial: boolean;
  isPending: boolean;

  // Employee mode
  isEmployeeSale: boolean;
  setIsEmployeeSale: (val: boolean) => void;

  // Adjustment
  adjustmentType: "discount" | "extra";
  handleAdjustmentTypeChange: (val: string) => void;
  discountAmount: number;
  setDiscountAmount: (val: number) => void;
  extraAmount: number;
  setExtraAmount: (val: number) => void;
  adjustmentReason: string;
  setAdjustmentReason: (val: string) => void;

  // Service charge
  applyServiceCharge: boolean;
  setApplyServiceCharge: (val: boolean) => void;

  // Payment
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;

  // VIP / Fiado
  selectedCustomerId: string;
  setSelectedCustomerId: (val: string) => void;
  dueDate: Date;
  setDueDate: (val: Date) => void;
  customerOptions: ComboboxOption[];

  // Partial info
  selectedItemIds: Set<string>;

  // Action
  onPay: () => void;
}

export const ComandaPaymentSection = ({
  comanda,
  totals,
  isPartial,
  isPending,
  isEmployeeSale,
  setIsEmployeeSale,
  adjustmentType,
  handleAdjustmentTypeChange,
  discountAmount,
  setDiscountAmount,
  extraAmount,
  setExtraAmount,
  adjustmentReason,
  setAdjustmentReason,
  applyServiceCharge,
  setApplyServiceCharge,
  paymentMethod,
  setPaymentMethod,
  selectedCustomerId,
  setSelectedCustomerId,
  dueDate,
  setDueDate,
  customerOptions,
  selectedItemIds,
  onPay,
}: ComandaPaymentSectionProps) => {
  return (
    <div className="flex min-h-0 flex-col border-r border-border bg-muted/30">
      <div className="scrollbar-hide hover:scrollbar-default flex-1 space-y-2 overflow-y-auto p-2 transition-all">
        {/* Metrics Section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
              <Clock size={12} />
              Aberta há
            </span>
            <p className="text-sm font-bold capitalize text-foreground">
              {formatDistanceToNow(comanda.firstOrderAt, {
                locale: ptBR,
              })}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-right shadow-sm">
            <span className="mb-1 flex items-center justify-end gap-1.5 text-[10px] font-black uppercase italic tracking-tighter text-primary/60">
              <CheckCircle2 size={12} />
              Total Acumulado
            </span>
            <p className="text-xl font-black tracking-tighter text-primary">
              {formatCurrency(totals.totalWithTip)}
            </p>
          </div>
        </div>

        {/* General Order Notes */}
        {comanda.orders.some(o => o.notes) && (
          <div className="space-y-2 rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Observações da Comanda</span>
            <div className="space-y-2">
              {comanda.orders.map(order => order.notes && (
                <div key={order.id} className="flex gap-2 text-xs font-bold italic text-orange-700">
                  <span className="shrink-0">#{order.orderNumber}:</span>
                  <p>{order.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Employee Mode Toggle */}
        <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Modo Funcionário
              </Label>
              <p className="text-[9px] font-medium italic text-muted-foreground">
                {isEmployeeSale
                  ? "Preço de Custo + Operacional"
                  : "Preço de Venda Normal"}
              </p>
            </div>
            <Switch
              checked={isEmployeeSale}
              onCheckedChange={setIsEmployeeSale}
            />
          </div>
        </div>

        {/* Adjustment Section */}
        <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/20 p-3">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="text-xs font-black">⚙️</span>
                </div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Ajuste Manual
                </Label>
              </div>

              <Tabs
                value={adjustmentType}
                onValueChange={handleAdjustmentTypeChange}
                className="h-8"
              >
                <TabsList className="h-8 bg-muted/50 p-1">
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
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {adjustmentType === "discount"
                    ? "Valor do Desconto"
                    : "Valor do Acréscimo"}
                </Label>
                {adjustmentType === "discount" && (
                  <p className="text-[9px] font-medium italic text-muted-foreground">
                    Máx:{" "}
                    {formatCurrency(
                      totals.relevantSubtotal +
                        totals.serviceChargeAmount,
                    )}
                  </p>
                )}
              </div>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">
                  R$
                </span>
                <Input
                  type="number"
                  min={0}
                  placeholder="0,00"
                  className="h-9 pl-8 font-black text-primary"
                  value={
                    adjustmentType === "discount"
                      ? discountAmount || ""
                      : extraAmount || ""
                  }
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    const amount = isNaN(val) ? 0 : Math.max(0, val);
                    if (adjustmentType === "discount") {
                      setDiscountAmount(amount);
                    } else {
                      setExtraAmount(amount);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {(discountAmount > 0 || extraAmount > 0) && (
            <div className="space-y-1.5 border-t border-border pt-3">
              <Label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <CheckCircle2 size={12} className="text-primary" />{" "}
                Justificativa do Ajuste
              </Label>
              <Input
                placeholder="Ex: Cliente VIP, Troco retido, Cortesia..."
                className="h-8 text-xs italic"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Partial selection info */}
        {isPartial && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 text-center animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-bold text-emerald-600">
              {selectedItemIds.size} item(s) selecionado(s) para
              pagamento parcial.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Actions Area */}
      <div className="mt-auto border-t border-border bg-background px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="w-full space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                Taxa de Serviço (10%)
              </Label>
              <div className="flex h-12 items-center justify-between rounded-xl border border-border bg-muted/50 px-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={applyServiceCharge}
                    onCheckedChange={setApplyServiceCharge}
                    id="comanda-service-charge"
                  />
                  <Label
                    htmlFor="comanda-service-charge"
                    className="text-xs font-bold leading-none"
                  >
                    {applyServiceCharge ? "Ativada" : "Desativada"}
                  </Label>
                </div>
                <span
                  className={cn(
                    "text-sm font-black transition-colors",
                    applyServiceCharge
                      ? "text-primary"
                      : "text-muted-foreground/50",
                  )}
                >
                  {formatCurrency(totals.serviceChargeAmount)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Pagamento
              </span>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger className="h-12 rounded-2xl border-border bg-background font-bold shadow-sm focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={5}
                  className="w-[var(--radix-select-trigger-width)]"
                >
                  {Object.entries(paymentMethodLabels).map(
                    ([key, { label, icon }]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="my-1 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {icon}
                          <span className="font-bold">{label}</span>
                        </div>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {paymentMethod === "PENDING_PAYMENT" && (
            <div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50/50 p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-black uppercase tracking-widest text-orange-700">
                  Opções de Pagamento Futuro (Fiado)
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Cliente VIP (Obrigatório)
                  </Label>
                  <Combobox
                    options={customerOptions}
                    value={selectedCustomerId}
                    onChange={setSelectedCustomerId}
                    placeholder="Selecione o cliente..."
                  />
                  {!selectedCustomerId && (
                    <p className="text-[10px] font-bold text-destructive">
                      * Selecione um cliente para liberar.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Data de Vencimento
                  </Label>
                  <DatePicker
                    value={dueDate}
                    onChange={(date) => date && setDueDate(date)}
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            className={cn(
              "h-14 w-full rounded-2xl text-lg font-black uppercase italic tracking-wider ring-offset-2 transition-all active:scale-95 disabled:opacity-50",
              isPartial
                ? "bg-primary text-background shadow-lg shadow-primary/20 hover:bg-primary/90"
                : "bg-emerald-600 text-background shadow-lg shadow-emerald-100 hover:bg-emerald-700",
            )}
            disabled={isPending || (paymentMethod === "PENDING_PAYMENT" && !selectedCustomerId)}
            onClick={onPay}
          >
            {isPending ? (
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            ) : (
              <>
                {isPartial ? "Pagar Selecionados" : "Finalizar Comanda"}{" "}
                • {formatCurrency(totals.totalWithTip)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

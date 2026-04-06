"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { 
  EditIcon, 
  CheckIcon, 
  XIcon, 
  Loader2Icon, 
  DollarSignIcon,
  TrendingUpIcon,
  WalletIcon,
  PiggyBankIcon,
  CalculatorIcon,
  ShoppingBagIcon,
  CircleDollarSignIcon
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { upsertProduct } from "@/app/_actions/product/upsert-product";
import { toast } from "sonner";
import { NumericFormat } from "react-number-format";
import { calculateMargin } from "@/app/_lib/pricing";
import { cn } from "@/app/_lib/utils";

interface InlineFinancialSummaryProps {
  product: {
    id: string;
    name: string;
    type: string;
    price: number;
    cost: number;
    operationalCost: number;
    [key: string]: any;
  };
}

export default function InlineFinancialSummary({ product }: InlineFinancialSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(product.price);
  const [cost, setCost] = useState(product.cost);
  const [operationalCost, setOperationalCost] = useState(product.operationalCost);

  const { execute: executeUpdate, isPending } = useAction(upsertProduct, {
    onSuccess: () => {
      toast.success("Valores atualizados.");
      setIsEditing(false);
    },
    onError: () => toast.error("Erro ao salvar alterações."),
  });

  const isPrepared = product.type === "COMBO" || product.type === "PRODUCAO_PROPRIA";
  const totalCost = cost + operationalCost;
  const currentMargin = calculateMargin(price, totalCost);

  const handleSave = () => {
    executeUpdate({
      ...product,
      id: product.id,
      price,
      cost,
      operationalCost,
      // Ensure all fields map correctly
      name: product.name,
      type: product.type as any,
      unit: product.unit as any,
      stock: product.stock,
      minStock: product.minStock,
      sku: product.sku,
      categoryId: product.categoryId,
      environmentId: product.environmentId,
      trackExpiration: product.trackExpiration,
      expirationDate: product.expirationDate ? new Date(product.expirationDate) : null,
      imageUrl: product.imageUrl || "",
    });
  };

  const formatCurrency = (val: number) =>
    Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <Card className={cn(
      "border border-border/40 bg-card rounded-xl shadow-sm transition-all duration-300",
      isEditing && "ring-1 ring-primary/20 border-primary/30 shadow-md"
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/5 text-primary">
            <DollarSignIcon size={16} />
          </div>
          <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Resumo Financeiro
          </CardTitle>
        </div>
        {!isEditing ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)} 
            className="h-8 w-8 p-0 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            aria-label="Editar Financeiro"
          >
            <EditIcon size={14} />
          </Button>
        ) : (
          <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} disabled={isPending} className="h-7 w-7 text-muted-foreground hover:bg-white rounded-lg" aria-label="Cancelar">
              <XIcon size={14} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSave} disabled={isPending} className="h-7 w-7 text-primary hover:bg-white rounded-lg shadow-sm" aria-label="Salvar">
              {isPending ? <Loader2Icon size={14} className="animate-spin" /> : <CheckIcon size={14} />}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Preço de Venda */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-50/50 p-6 transition-all hover:bg-slate-50 border border-slate-100/50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <WalletIcon size={16} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 leading-none mt-0.5">Venda</p>
              </div>
              {isEditing ? (
                <NumericFormat
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  onValueChange={(vals) => setPrice(vals.floatValue || 0)}
                  value={price}
                  className="h-10 text-2xl font-black bg-white border-slate-200 focus-visible:ring-primary/20 shadow-sm px-3 rounded-xl"
                />
              ) : (
                <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{formatCurrency(price)}</p>
              )}
            </div>
          </div>

          {/* Custo Insumos */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-50/50 p-6 transition-all hover:bg-slate-50 border border-slate-100/50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <ShoppingBagIcon size={16} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 leading-none mt-0.5 truncate">
                  {isPrepared ? "Insumos" : "Custo Base"}
                </p>
              </div>
              {isEditing && !isPrepared ? (
                <NumericFormat
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  onValueChange={(vals) => setCost(vals.floatValue || 0)}
                  value={cost}
                  className="h-10 text-2xl font-black bg-white border-slate-200 focus-visible:ring-primary/20 shadow-sm px-3 rounded-xl"
                />
              ) : (
                <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{formatCurrency(cost)}</p>
              )}
            </div>
          </div>

          {/* Custo Operacional */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-50/50 p-6 transition-all hover:bg-slate-50 border border-slate-100/50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <CalculatorIcon size={16} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 leading-none mt-0.5">Operacional</p>
              </div>
              {isEditing ? (
                <NumericFormat
                  customInput={Input}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  onValueChange={(vals) => setOperationalCost(vals.floatValue || 0)}
                  value={operationalCost}
                  className="h-10 text-2xl font-black bg-white border-slate-200 focus-visible:ring-primary/20 shadow-sm px-3 rounded-xl"
                />
              ) : (
                <p className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{formatCurrency(operationalCost)}</p>
              )}
            </div>
          </div>

          {/* Custo Total */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 transition-all shadow-lg border border-slate-800">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-100">
                  <CircleDollarSignIcon size={16} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mt-0.5">Custo Total</p>
              </div>
              <p className="text-2xl font-black text-white tracking-tight tabular-nums">{formatCurrency(totalCost)}</p>
            </div>
          </div>

          {/* Lucro / Margem */}
          <div className={cn(
            "relative overflow-hidden rounded-3xl p-6 transition-all tabular-nums border",
            currentMargin < 15 ? "bg-amber-50/50 hover:bg-amber-50 border-amber-100" : currentMargin < 0 ? "bg-red-50/50 hover:bg-red-50 border-red-100" : "bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100"
          )}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  currentMargin < 15 ? "bg-amber-100 text-amber-600" : currentMargin < 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  <TrendingUpIcon size={16} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 leading-none mt-0.5">Lucro Líquido</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={cn(
                  "text-2xl font-black tracking-tight",
                  currentMargin < 15 ? "text-amber-600" : currentMargin < 0 ? "text-destructive" : "text-emerald-600"
                )}>
                  {currentMargin}%
                </p>
                <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Margem</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

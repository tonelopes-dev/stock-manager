"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { EditIcon, CheckIcon, XIcon, Loader2Icon, DollarSignIcon } from "lucide-react";
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
    [key: string]: any;
  };
}

export default function InlineFinancialSummary({ product }: InlineFinancialSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(product.price);
  const [cost, setCost] = useState(product.cost);

  const { execute: executeUpdate, isPending } = useAction(upsertProduct, {
    onSuccess: () => {
      toast.success("Valores atualizados.");
      setIsEditing(false);
    },
    onError: () => toast.error("Erro ao salvar alterações."),
  });

  const isPrepared = product.type === "COMBO" || product.type === "PRODUCAO_PROPRIA";
  const currentMargin = calculateMargin(price, cost);

  const handleSave = () => {
    executeUpdate({
      ...product,
      id: product.id,
      price,
      cost,
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Preço de Venda</p>
            {isEditing ? (
              <NumericFormat
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                onValueChange={(vals) => setPrice(vals.floatValue || 0)}
                value={price}
                className="h-12 text-2xl font-black bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none px-3"
              />
            ) : (
              <p className="text-3xl font-black text-foreground tracking-tight">{formatCurrency(price)}</p>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
              {isPrepared ? "Custo (Receita)" : "Custo Fixo"}
            </p>
            {isEditing && !isPrepared ? (
              <NumericFormat
                customInput={Input}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                onValueChange={(vals) => setCost(vals.floatValue || 0)}
                value={cost}
                className="h-12 text-2xl font-black bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none px-3"
              />
            ) : (
              <p className="text-3xl font-black text-foreground tracking-tight">{formatCurrency(cost)}</p>
            )}
          </div>
          <div className="space-y-3 border-l md:pl-8 border-border/40">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Lucro Líquido</p>
            <div className="flex items-baseline gap-2">
               <p className={cn(
                 "text-3xl font-black tracking-tight",
                 currentMargin < 15 ? "text-amber-600" : currentMargin < 0 ? "text-destructive" : "text-emerald-600"
               )}>
                {currentMargin}%
              </p>
              <span className="text-xs font-bold text-muted-foreground opacity-40 uppercase tracking-tighter">Margem</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

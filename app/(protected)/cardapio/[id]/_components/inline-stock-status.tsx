"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { EditIcon, CheckIcon, XIcon, Loader2Icon, BoxIcon, AlertCircleIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { upsertProduct } from "@/app/_actions/product/upsert-product";
import { toast } from "sonner";
import { cn } from "@/app/_lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";

interface InlineStockStatusProps {
  product: {
    id: string;
    stock: number;
    minStock: number;
    unit: string;
    [key: string]: any;
  };
}

export default function InlineStockStatus({ product }: InlineStockStatusProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [stock, setStock] = useState(product.isMadeToOrder ? product.virtualStock : (product.stock ?? 0));
  const [minStock, setMinStock] = useState(product.minStock ?? 0);
  
  // Sync state with props when they change (e.g. after producing a batch)
  useEffect(() => {
    setStock(product.isMadeToOrder ? product.virtualStock : (product.stock ?? 0));
    setMinStock(product.minStock ?? 0);
  }, [product.stock, product.minStock, product.virtualStock, product.isMadeToOrder]);

  const { execute: executeUpdate, isPending } = useAction(upsertProduct, {
    onSuccess: () => {
      toast.success("Estoque atualizado.");
      setIsEditing(false);
    },
    onError: () => toast.error("Erro ao salvar estoque."),
  });

  const handleSave = () => {
    executeUpdate({
      ...product,
      id: product.id,
      stock: product.isMadeToOrder ? product.stock : (stock ?? 0), // Don't overwrite physical stock for MTO via this UI
      minStock: minStock ?? 0,
      // Mapping all necessary fields
      unit: product.unit as any,
      type: product.type as any,
      price: product.price,
      cost: product.cost,
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      environmentId: product.environmentId,
      trackExpiration: product.trackExpiration,
      expirationDate: product.expirationDate ? new Date(product.expirationDate) : null,
      imageUrl: product.imageUrl || "",
    });
  };

  const displayStock = Number(stock ?? 0);
  const currentMinStock = Number(minStock ?? 0);
  const isLowStock = displayStock <= currentMinStock;

  return (
    <Card className={cn(
      "border-none bg-white rounded-[2rem] shadow-sm transition-all duration-300",
      isEditing && "ring-2 ring-amber-500/10 shadow-xl"
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-xl",
            isLowStock ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          )}>
            <BoxIcon size={18} />
          </div>
          <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none mt-1">
            {product.isMadeToOrder ? "Disponibilidade" : "Status do Estoque"}
          </CardTitle>
        </div>
        {(!isEditing && (!product.isMadeToOrder || true)) ? ( // Allow editing minStock even for MTO
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-colors rounded-lg" aria-label="Editar Estoque">
            <EditIcon size={14} />
          </Button>
        ) : isEditing && (
          <div className="flex gap-1 p-1 bg-muted/40 rounded-xl">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} disabled={isPending} className="h-7 w-7 text-muted-foreground hover:bg-white rounded-lg" aria-label="Cancelar">
              <XIcon size={14} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSave} disabled={isPending} className="h-7 w-7 text-primary hover:bg-white rounded-lg shadow-sm" aria-label="Salvar">
              {isPending ? <Loader2Icon size={14} className="animate-spin" /> : <CheckIcon size={14} />}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6 pt-2 space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-slate-50/50 p-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              {isEditing && !product.isMadeToOrder ? (
                <Input 
                  type="number" 
                  step="any"
                  value={stock} 
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="h-10 text-3xl font-black w-32 bg-white border-slate-200 shadow-sm px-3 rounded-xl focus-visible:ring-primary/20"
                />
              ) : (
                <span className={cn(
                  "text-5xl font-black tracking-tighter tabular-nums",
                  isLowStock ? "text-amber-600" : "text-slate-900"
                )}>{(displayStock ?? 0).toString()}</span>
              )}
              <span className="text-sm font-black text-muted-foreground/30 uppercase tracking-widest">{product.unit}</span>
            </div>
            <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">
              {product.isMadeToOrder ? "Produção Possível (Virtual)" : "Disponível em Estoque"}
            </p>
          </div>
        </div>

        {/* Technical Sheet Breakdown integrated inside the card */}
        {product.isMadeToOrder && product.ingredients && product.ingredients.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-dashed border-slate-200 p-4 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                Disponibilidade por Insumo
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <TooltipProvider>
                {product.ingredients.map((ing: any) => {
                  const isLimiting = product.limitingIngredient === ing.name;
                  const content = (
                    <div className={cn("flex items-center justify-between gap-2", isLimiting && "cursor-help")}>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={cn(
                          "text-xs truncate max-w-[150px] uppercase tracking-tight", 
                          isLimiting ? "font-black text-rose-600" : "font-bold text-slate-600"
                        )}>
                          {ing.name}
                        </span>
                        {isLimiting && <AlertCircleIcon size={12} className="text-rose-600 animate-pulse shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-black tabular-nums shrink-0", 
                          isLimiting ? "text-rose-600" : "text-slate-700"
                        )}>
                          {ing.availability}
                        </span>
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">{product.unit}</span>
                      </div>
                    </div>
                  );

                  if (!isLimiting) return <div key={ing.name} className="py-0.5">{content}</div>;

                  return (
                    <Tooltip key={ing.name}>
                      <TooltipTrigger asChild>
                        <div className="py-0.5">{content}</div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-rose-600 text-white border-none shadow-xl p-4 max-w-[240px]">
                        <div className="space-y-1.5">
                          <p className="text-xs font-black uppercase tracking-widest leading-none">Gargalo de Produção</p>
                          <p className="text-[11px] font-medium leading-normal opacity-95">
                            Este ingrediente é o que está limitando a produção total. Reponha o estoque de <strong>{ing.name}</strong> para aumentar a disponibilidade virtual.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl bg-slate-100/40 p-5">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground/60 font-black uppercase tracking-widest leading-none">Estoque Mínimo</span>
            <span className="text-[10px] text-muted-foreground font-medium opacity-50">Alerta de reposição ativado</span>
          </div>
          {isEditing ? (
            <Input 
              type="number" 
              step="any"
              value={minStock} 
              onChange={(e) => setMinStock(Number(e.target.value))}
              className="h-9 w-20 text-right font-black bg-white border-slate-200 shadow-sm rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-end">
               <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "font-black text-base tabular-nums",
                    isLowStock ? "text-amber-700" : "text-slate-700"
                  )}>{minStock}</span>
                  <span className="text-[9px] font-black text-muted-foreground/40 uppercase">{product.unit}</span>
               </div>
               {isLowStock && (
                 <div className="flex items-center gap-1 mt-0.5">
                   <AlertCircleIcon size={10} className="text-amber-600" />
                   <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Crítico</span>
                 </div>
               )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

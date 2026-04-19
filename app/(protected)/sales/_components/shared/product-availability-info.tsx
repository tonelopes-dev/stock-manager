"use client";

import { ProductDto } from "@/app/_data-access/product/get-products";
import { Badge } from "@/app/_components/ui/badge";
import { cn } from "@/app/_lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";

interface ProductAvailabilityInfoProps {
  product: ProductDto;
  className?: string;
  showDetails?: boolean; // If true, shows the ingredients grid for MTO
}

export const ProductAvailabilityInfo = ({
  product,
  className,
  showDetails = true,
}: ProductAvailabilityInfoProps) => {
  const getStockColor = (stock: number) => {
    if (stock > 10) return "bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm";
    if (stock >= 6) return "bg-amber-400 hover:bg-amber-500 text-black border-none shadow-sm";
    return "bg-rose-600 hover:bg-rose-700 text-white border-none shadow-sm";
  };

  return (
    <div className={cn("animate-in fade-in slide-in-from-top-1 duration-300", className)}>
      {/* Production Transparency Section */}
      {product.isMadeToOrder && product.ingredients && showDetails ? (
        <div className="space-y-1.5 rounded-xl border border-dashed border-border/60 p-2 bg-muted/5">
          <div className="flex items-center justify-between">
            <h5 className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
              Ficha Técnica
            </h5>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {product.ingredients.map((ing) => {
              const isLimiting = product.limitingIngredient === ing.name;
              return (
                <div key={ing.name} className="flex items-center justify-between gap-1.5 border-b border-border/10 pb-0.5 last:pb-0 last:border-0">
                  <span className={cn("text-[9px] truncate max-w-[80px]", isLimiting ? "font-black text-rose-600" : "font-medium text-muted-foreground")}>
                    {ing.name}
                  </span>
                  <span className={cn("text-[9px] font-black tabular-nums shrink-0", isLimiting ? "text-rose-600" : "text-foreground/80")}>
                    {ing.availability} un
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-1 border-t border-border/10">
             <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Badge className={cn("px-1.5 py-0 h-4 text-[9px] font-black uppercase tracking-tighter shadow-sm cursor-help", getStockColor(product.virtualStock))}>
                      {product.virtualStock} DISPONÍVEL
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="bg-popover border-border p-3 shadow-xl max-w-[220px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", product.virtualStock > 0 ? "bg-emerald-500" : "bg-rose-500")} />
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground">
                          Disponibilidade Virtual
                        </h5>
                      </div>
                      <p className="text-[9px] font-medium leading-relaxed text-muted-foreground italic">
                        Calculado via ficha técnica. O estoque disponível é limitado pelo insumo de menor quantidade.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
             </TooltipProvider>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
           <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Badge className={cn("px-2 py-0.5 h-auto text-[10px] font-black uppercase tracking-tighter shadow-sm cursor-help", getStockColor(product.virtualStock))}>
                    {product.virtualStock} {product.isMadeToOrder ? "DISPONÍVEL" : "EM ESTOQUE"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" align="end" className="bg-popover border-border p-3 shadow-xl max-w-[220px]">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", product.virtualStock > 0 ? "bg-emerald-500" : "bg-rose-500")} />
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground">
                        {product.isMadeToOrder ? "Estoque Virtual" : "Estoque Físico"}
                      </h5>
                    </div>
                    <p className="text-[9px] font-medium leading-relaxed text-muted-foreground italic">
                      {product.isMadeToOrder 
                        ? "Disponibilidade calculada via ficha técnica." 
                        : "Quantidade exata registrada em estoque físico."}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
           </TooltipProvider>
        </div>
      )}
    </div>
  );
};

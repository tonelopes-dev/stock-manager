"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Combobox, ComboboxOption } from "@/app/_components/ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { QuantityStepper } from "@/app/_components/ui/quantity-stepper";
import { formatCurrency } from "@/app/_helpers/currency";
import { cn } from "@/app/_lib/utils";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { Badge } from "@/app/_components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";

const composerSchema = z.object({
  productId: z.string().uuid({
    message: "O produto é obrigatório.",
  }),
  quantity: z.coerce.number().int().positive().default(1),
});

type ComposerSchema = z.infer<typeof composerSchema>;

interface CartComposerProps {
  products: ProductDto[];
  productOptions: ComboboxOption[];
  fields: any[];
  append: (item: any) => void;
  isReadOnly?: boolean;
}

export const CartComposer = ({ 
  products, 
  productOptions,
  fields,
  append,
  isReadOnly = false,
}: CartComposerProps) => {
  const form = useForm<ComposerSchema>({
    resolver: zodResolver(composerSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
    },
  });

  if (isReadOnly) return null;

  const selectedProductId = form.watch("productId");
  const selectedQuantity = form.watch("quantity");

  const currentProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const getStockColor = (stock: number) => {
    if (stock > 10) return "bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm";
    if (stock >= 6) return "bg-amber-400 hover:bg-amber-500 text-black border-none shadow-sm";
    return "bg-rose-600 hover:bg-rose-700 text-white border-none shadow-sm";
  };

  const onAddProduct = (data: ComposerSchema) => {
    const product = products.find((p) => p.id === data.productId);
    if (!product) return;

    // Check if product already exists in items using productId
    const existingIndex = fields.findIndex((item) => item.productId === product.id);
    
    if (existingIndex !== -1) {
      // In a more advanced version, we would use 'update' here to increment the quantity.
      // For now, to solve the rendering bug, we'll keep it simple and just append 
      // or the user can manage consolidation. 
      // Actually, let's just append to ensure the 'Fields' array registers a new entry.
    }

    append({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      cost: Number(product.cost),
      operationalCost: Number(product.operationalCost),
      stock: Number(product.stock),
      quantity: data.quantity,
    });

    form.reset({ productId: "", quantity: 1 });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-foreground">Compor Carrinho</h4>
          <p className="text-[9px] font-medium uppercase text-muted-foreground">
            Adicione produtos e quantidades
          </p>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-3" onSubmit={form.handleSubmit(onAddProduct)}>
          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">
                    Produto
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      placeholder="Buscar produto..."
                      options={productOptions}
                      {...field}
                      data-testid="product-search-combobox"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <div className="flex items-end gap-3">
              <div className="w-[110px] shrink-0">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase text-muted-foreground">
                        Quantidade
                      </FormLabel>
                      <FormControl>
                        <QuantityStepper
                          value={field.value}
                          onChange={field.onChange}
                          className="h-10 w-full"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                {/* Production Transparency Section */}
                {currentProduct && currentProduct.isMadeToOrder && currentProduct.ingredients && (
                  <div className="space-y-1.5 rounded-xl border border-dashed border-border/60 p-2 bg-muted/5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Ficha Técnica
                      </h5>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {currentProduct.ingredients.map((ing) => {
                        const isLimiting = currentProduct.limitingIngredient === ing.name;
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
                              <Badge className={cn("px-1.5 py-0 h-4 text-[9px] font-black uppercase tracking-tighter shadow-sm", getStockColor(currentProduct.virtualStock))}>
                                {currentProduct.virtualStock} DISPONÍVEL
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="end" className="bg-popover border-border p-3 shadow-xl max-w-[220px]">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", currentProduct.virtualStock > 0 ? "bg-emerald-500" : "bg-rose-500")} />
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
                )}

                {/* Simple Badge for Resale Products */}
                {currentProduct && !currentProduct.isMadeToOrder && (
                   <div className="flex justify-end">
                      <Badge className={cn("px-2 py-0.5 h-auto text-[10px] font-black uppercase tracking-tighter shadow-sm", getStockColor(currentProduct.virtualStock))}>
                        {currentProduct.virtualStock} EM ESTOQUE
                      </Badge>
                   </div>
                )}
              </div>
            </div>
          </div>

          {currentProduct && (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-muted p-3 animate-in fade-in slide-in-from-top-2 md:flex-row md:items-center">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                  Resumo Parcial
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-foreground">
                    {formatCurrency(
                      Number(currentProduct.price) * selectedQuantity,
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    ({selectedQuantity}x{" "}
                    {formatCurrency(Number(currentProduct.price))})
                  </span>
                </div>
              </div>
              <Button type="submit" className="h-10 gap-2 font-bold" variant="default">
                <PlusIcon size={18} />
                Adicionar à Lista
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

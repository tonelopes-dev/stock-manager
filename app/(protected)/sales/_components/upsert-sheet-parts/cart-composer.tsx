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

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground">
                    Quantidade
                    {currentProduct && (
                      <span
                        className={cn(
                          "text-[9px] font-bold lowercase italic",
                          Number(currentProduct.stock) < 0
                            ? "text-destructive"
                            : "text-muted-foreground/60",
                        )}
                      >
                        {Number(currentProduct.stock)} em estoque
                      </span>
                    )}
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

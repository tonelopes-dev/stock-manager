"use client";

import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, Utensils } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/app/_components/ui/sheet";
import { Button } from "@/app/_components/ui/button";
import { Textarea } from "@/app/_components/ui/textarea";
import { MenuProductDto } from "@/app/_data-access/menu/get-menu-data";
import { useCartStore } from "../_store/use-cart-store";
import { cn } from "@/app/_lib/utils";
import { isPromotionActive } from "@/app/_lib/promotion";

interface ProductDetailsSheetProps {
  product: MenuProductDto | null;
  onClose: () => void;
}

export const ProductDetailsSheet = ({
  product,
  onClose,
}: ProductDetailsSheetProps) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const { items, addItem, allowNegativeStock } = useCartStore();

  if (!product) return null;

  const totalInCart = items
    .filter((i) => i.productId === product.id)
    .reduce((acc, i) => acc + i.quantity, 0);

  const formatPrice = (price: number) =>
    Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      price,
    );

  const hasActivePromotion = isPromotionActive(product);
  const activePrice = hasActivePromotion && product.promoPrice ? Number(product.promoPrice) : Number(product.price);

  const isOutOfStock = product.availability <= 0 && !allowNegativeStock;
  const isMaxQuantityReached = !allowNegativeStock && (quantity + totalInCart) >= product.availability;

  const handleAddToCart = () => {
    const success = addItem({
      productId: product.id,
      name: product.name,
      price: activePrice,
      quantity,
      maxQuantity: product.availability,
      image: product.imageUrl || undefined,
      notes,
    });

    if (!success) {
      toast.error("Quantidade indisponível no estoque!", {
        description: allowNegativeStock 
          ? "Erro inesperado ao adicionar." 
          : `O limite para este item é de ${product.availability} unidades.`,
      });
      return;
    }

    toast.success(`${product.name} adicionado à sacola!`, {
      description: `${quantity}x por ${formatPrice(activePrice * quantity)}`,
      icon: <ShoppingBag className="h-4 w-4 text-primary" />,
    });
    
    setQuantity(1);
    setNotes("");
    onClose();
  };

  return (
    <Sheet open={!!product} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        hideClose
        className="mx-auto flex h-[85vh] max-w-md flex-col rounded-t-[3rem] border-none p-0 shadow-2xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{product.name}</SheetTitle>
        </SheetHeader>

        {/* Product Header / Image */}
        <div className="relative aspect-video w-full overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Utensils className="h-12 w-12 text-gray-200" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-6 top-6 z-20 h-10 w-10 rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Product Info */}
        <div className="flex-1 overflow-y-auto px-8 pt-8">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-black tracking-tight text-gray-900">
                {product.name}
              </h2>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xl font-black text-primary">
                  {formatPrice(activePrice)}
                </span>
                {product.promoPrice && hasActivePromotion && (
                  <span className="text-xs font-bold text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
                {/* Availability Badge - Only shown when limit reached */}
                {isMaxQuantityReached && (
                  <div className={cn(
                    "mt-1 rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm animate-in fade-in zoom-in duration-300",
                    product.availability > 10 ? "bg-emerald-500" : 
                    product.availability > 0 ? "bg-amber-500" : 
                    allowNegativeStock ? "bg-sky-500" : "bg-rose-500"
                  )}>
                    {product.availability} {product.isMadeToOrder ? "Disponíveis" : "Em Estoque"}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              {product.description ||
                "Descrição detalhada do produto não informada. Preparado com todo o cuidado para garantir a melhor experiência gastronômica."}
            </p>
          </div>

          {/* Observations Field */}
          <div className="mt-8 space-y-3 pb-8">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400">
              Alguma observação?
            </label>
            <Textarea
              placeholder="Ex: sem cebola, ponto da carne mal passado, retirar tomate..."
              className="min-h-[100px] rounded-2xl border-none bg-gray-50 p-4 text-sm focus-visible:ring-primary/20"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="product-details-notes"
            />
          </div>
        </div>

        {/* Footer with Quantity & Add Button */}
        <div className="flex flex-col gap-4 border-t bg-white px-8 pb-10 pt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Quantidade
            </span>
            <div className="flex items-center gap-4 rounded-2xl border bg-muted p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center text-sm font-black">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl"
                disabled={isMaxQuantityReached}
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            className="h-16 w-full rounded-[2rem] bg-gray-900 text-lg font-black text-white shadow-xl transition-all active:scale-[0.98] hover:bg-gray-800 disabled:bg-gray-300"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            data-testid="product-details-add-button"
          >
            {isOutOfStock 
              ? "ESGOTADO" 
              : `ADICIONAR À SACOLA • ${formatPrice(activePrice * quantity)}`
            }
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

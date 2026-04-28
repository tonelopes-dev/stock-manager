"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Tag, ShoppingBag, Plus, Star } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { MenuProductDto } from "@/app/_data-access/menu/get-menu-data";
import { useCartStore } from "../../_store/use-cart-store";
import { toast } from "sonner";
import { useState } from "react";
import { ProductDetailsSheet } from "../../_components/product-details-sheet";
import { FloatingCartButton } from "../../_components/floating-cart-button";
import { BottomNav } from "../../_components/bottom-nav";

interface PromotionsClientProps {
  companySlug: string;
  companyId: string;
  products: MenuProductDto[];
  companyName: string;
}

export function PromotionsClient({ companySlug, companyId, products, companyName }: PromotionsClientProps) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<MenuProductDto | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50/50 font-sans shadow-2xl">
      <header className="sticky top-0 z-20 bg-white/95 px-6 pb-6 pt-10 shadow-sm backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              Ofertas Imperdíveis
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
              {companyName}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Tag size={20} className="fill-primary/20" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 pb-32">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-background shadow-xl shadow-slate-200/50">
              <Tag className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Sem ofertas no momento
            </h3>
            <p className="mt-2 max-w-[200px] text-sm text-muted-foreground">
              Fique de olho! Novas promoções podem surgir a qualquer momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative overflow-hidden rounded-[2.5rem] bg-white p-4 shadow-xl shadow-gray-200/40 transition-all active:scale-[0.98]"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="flex gap-4">
                  {product.imageUrl && (
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                        <Tag size={12} />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-center">
                    <h3 className="text-sm font-black text-gray-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-[10px] font-medium text-gray-400 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-base font-black text-primary">
                        {formatPrice(product.promoPrice!)}
                      </span>
                      <span className="text-[10px] font-bold text-gray-300 line-through">
                        {formatPrice(product.price)}
                      </span>
                      {product.promoPrice && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black px-2">
                          -{Math.round((1 - product.promoPrice / product.price) * 100)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      size="icon"
                      className="h-10 w-10 rounded-2xl bg-gray-900 text-white shadow-lg shadow-gray-200"
                    >
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product Details Sheet */}
      <ProductDetailsSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Floating Cart Button */}
      <FloatingCartButton companyId={companyId} />

      {/* Bottom Navigation */}
      <BottomNav companySlug={companySlug} />
    </div>
  );
}

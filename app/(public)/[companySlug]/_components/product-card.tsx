import Image from "next/image";
import { Plus, Utensils } from "lucide-react";
import { MenuProductDto } from "@/app/_data-access/menu/get-menu-data";
import { cn } from "@/app/_lib/utils";
import { useCartStore } from "../_store/use-cart-store";
import { isPromotionActive } from "@/app/_lib/promotion";

interface ProductCardProps {
  product: MenuProductDto;
  onClick: (product: MenuProductDto) => void;
}

export const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const allowNegativeStock = useCartStore((state) => state.allowNegativeStock);
  const isOutOfStock = product.availability <= 0 && !allowNegativeStock;
  const hasActivePromotion = isPromotionActive(product);

  const formatPrice = (price: number) =>
    Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      price,
    );

  return (
    <div
      data-testid={`public-product-card-${product.id}`}
      className={cn(
        "group relative flex cursor-pointer gap-4 rounded-3xl bg-white p-2 transition-all active:scale-[0.98]",
        isOutOfStock && "opacity-60 grayscale"
      )}
      onClick={() => onClick(product)}
    >
      {isOutOfStock && (
        <div className="absolute left-0 top-0 z-10 flex h-full w-full items-center justify-center">
          <span className="rounded-lg bg-black/80 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
            Esgotado
          </span>
        </div>
      )}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Utensils className="h-6 w-6 text-gray-200" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between py-1 pr-2">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</h3>
          <p className="line-clamp-2 text-[10px] leading-relaxed text-gray-400">
            {product.description || "Ingredientes selecionados para o melhor sabor."}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {product.promoPrice && hasActivePromotion ? (
              <>
                <span className="text-sm font-black text-primary">
                  {formatPrice(product.promoPrice)}
                </span>
                <span className="text-[10px] font-bold text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-sm font-black text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg transition-transform group-hover:scale-110">
            <Plus className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

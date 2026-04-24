"use client";

import Image from "next/image";
import { useAction } from "next-safe-action/hooks";
import { toggleMenuVisibility } from "@/app/_actions/product/toggle-menu-visibility";
import { togglePromotion } from "@/app/_actions/product/toggle-promotion";
import { Switch } from "@/app/_components/ui/switch";
import { Badge } from "@/app/_components/ui/badge";
import { toast } from "sonner";
import { Eye, EyeOff, Flame, PackageX, Utensils } from "lucide-react";
import type { MenuManagementProduct } from "@/app/_data-access/menu/get-menu-management-data";

interface MenuProductCardProps {
  product: MenuManagementProduct;
}

export const MenuProductCard = ({ product }: MenuProductCardProps) => {
  const { execute: execToggleVisibility, isExecuting: isTogglingVisibility } =
    useAction(toggleMenuVisibility, {
      onSuccess: () =>
        toast.success(
          product.isVisibleOnMenu
            ? `"${product.name}" removido do cardápio`
            : `"${product.name}" adicionado ao cardápio`,
        ),
      onError: () => toast.error("Erro ao alterar visibilidade."),
    });

  const { execute: execTogglePromotion, isExecuting: isTogglingPromotion } =
    useAction(togglePromotion, {
      onSuccess: () =>
        toast.success(
          product.isPromotion
            ? `Promoção desativada para "${product.name}"`
            : `"${product.name}" marcado como promoção 🔥`,
        ),
      onError: () => toast.error("Erro ao alterar promoção."),
    });

  const formatPrice = (price: number) =>
    Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);

  const isOutOfStock = product.stock <= 0;

  return (
    <div
      className={`group relative flex items-center gap-4 rounded-xl border px-4 py-3 transition-all ${
        product.isVisibleOnMenu
          ? "border-border bg-background shadow-sm hover:shadow-md"
          : "border-dashed border-border bg-muted/50 opacity-70"
      }`}
    >
      {/* Product Avatar */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/50 shadow-sm">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Utensils className="h-5 w-5 text-gray-300" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="truncate text-sm font-black text-foreground">
            {product.name}
          </h4>
          {product.isPromotion && (
            <Badge className="gap-1 bg-orange-500 px-1.5 py-0 text-[10px] text-white hover:bg-orange-600">
              <Flame className="h-3 w-3" />
              Promo
            </Badge>
          )}
          
          {/* Stock Monitor */}
          {product.stock <= 0 ? (
            <Badge
              variant="destructive"
              className="gap-1 px-1.5 py-0 text-[10px] font-black uppercase"
            >
              <PackageX className="h-3 w-3" />
              Esgotado
            </Badge>
          ) : product.stock <= 5 ? (
            <Badge
              variant="outline"
              className="gap-1 border-orange-200 bg-orange-50 px-1.5 py-0 text-[10px] font-black uppercase text-orange-600"
            >
              Estoque Baixo: {product.stock}
            </Badge>
          ) : (
            <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
              Estoque: {product.stock}
            </span>
          )}
        </div>
        <p className="text-xs font-black text-primary">
          {formatPrice(product.price)}
        </p>
      </div>

      {/* Toggle: Visible on Menu */}
      <div className="flex items-center gap-1.5">
        {product.isVisibleOnMenu ? (
          <Eye className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <Switch
          checked={product.isVisibleOnMenu}
          disabled={isTogglingVisibility}
          onCheckedChange={() =>
            execToggleVisibility({ productId: product.id })
          }
          className="data-[state=checked]:bg-green-600"
        />
      </div>

      {/* Toggle: Promotion */}
      <div className="flex items-center gap-1.5">
        <Flame
          className={`h-3.5 w-3.5 ${
            product.isPromotion ? "text-orange-500" : "text-muted-foreground"
          }`}
        />
        <Switch
          checked={product.isPromotion}
          disabled={isTogglingPromotion}
          onCheckedChange={() => execTogglePromotion({ productId: product.id })}
          className="data-[state=checked]:bg-orange-500"
        />
      </div>
    </div>
  );
};

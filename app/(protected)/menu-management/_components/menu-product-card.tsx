"use client";

import { useAction } from "next-safe-action/hooks";
import { toggleMenuVisibility } from "@/app/_actions/product/toggle-menu-visibility";
import { togglePromotion } from "@/app/_actions/product/toggle-promotion";
import { Switch } from "@/app/_components/ui/switch";
import { Badge } from "@/app/_components/ui/badge";
import { toast } from "sonner";
import { Eye, EyeOff, Flame, PackageX } from "lucide-react";
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
          ? "border-slate-200 bg-white shadow-sm hover:shadow-md"
          : "border-dashed border-slate-200 bg-slate-50/50 opacity-70"
      }`}
    >
      {/* Product Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-bold text-slate-800">
            {product.name}
          </h4>
          {product.isPromotion && (
            <Badge className="gap-1 bg-orange-100 px-1.5 py-0 text-[10px] text-orange-700 hover:bg-orange-100">
              <Flame className="h-3 w-3" />
              Promo
            </Badge>
          )}
          {isOutOfStock && (
            <Badge
              variant="destructive"
              className="gap-1 px-1.5 py-0 text-[10px]"
            >
              <PackageX className="h-3 w-3" />
              Sem estoque
            </Badge>
          )}
        </div>
        <p className="text-xs font-semibold text-primary">
          {formatPrice(product.price)}
        </p>
      </div>

      {/* Toggle: Visible on Menu */}
      <div className="flex items-center gap-1.5">
        {product.isVisibleOnMenu ? (
          <Eye className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <EyeOff className="h-3.5 w-3.5 text-slate-400" />
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
            product.isPromotion ? "text-orange-500" : "text-slate-400"
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

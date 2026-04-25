"use client";

import Image from "next/image";
import { useAction } from "next-safe-action/hooks";
import { toggleMenuVisibility } from "@/app/_actions/product/toggle-menu-visibility";
import { Switch } from "@/app/_components/ui/switch";
import { Badge } from "@/app/_components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/app/_lib/utils";
import { Eye, EyeOff, PackageX, Utensils, Star, Tag } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import type { MenuManagementProduct } from "@/app/_data-access/menu/get-menu-management-data";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger,
  TooltipPortal
} from "@/app/_components/ui/tooltip";
import * as React from "react";
import { Dialog } from "@/app/_components/ui/dialog";
import { PromotionSettingsModal } from "./promotion-settings-modal";
import { ProductDto } from "@/app/_data-access/product/get-products";

interface MenuProductCardProps {
  product: MenuManagementProduct;
}

export const MenuProductCard = ({ product }: MenuProductCardProps) => {
  const [isPromotionModalOpen, setIsPromotionModalOpen] = React.useState(false);

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

  const isPromoCurrentlyActive = product.promoActive;

  const formatPrice = (price: number) =>
    Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);

  return (
    <TooltipProvider>
      <div
        data-testid={`menu-product-card-${product.id}`}
        className={cn(
          "group relative flex items-center gap-4 rounded-xl border px-4 py-3 transition-all",
          product.isVisibleOnMenu
            ? "border-border bg-background shadow-sm hover:shadow-md"
            : "border-dashed border-border bg-muted/50 opacity-70"
        )}
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
            {isPromoCurrentlyActive && (
              <Badge className="bg-primary/10 text-primary border-none text-[10px] py-0 px-1.5 font-bold hover:bg-primary/20">
                Promo
              </Badge>
            )}

            {product.isFeatured && (
              <Badge className="gap-1 bg-yellow-500 px-1.5 py-0 text-[10px] text-white hover:bg-yellow-600">
                <Star className="h-3 w-3 fill-white" />
                Destaque
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
          <div className="flex items-center gap-2">
            {product.promoPrice && product.promoActive ? (
              <>
                <p className="text-sm font-black text-primary">
                  {formatPrice(product.promoPrice)}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground line-through opacity-60">
                  {formatPrice(product.price)}
                </p>
              </>
            ) : (
              <p className="text-sm font-black text-primary">
                {formatPrice(product.price)}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Toggle: Visible on Menu */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  {product.isVisibleOnMenu ? (
                    <Eye className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <Switch
                    data-testid={`visibility-switch-${product.id}`}
                    checked={product.isVisibleOnMenu}
                    disabled={isTogglingVisibility}
                    onCheckedChange={() =>
                      execToggleVisibility({ productId: product.id })
                    }
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="top" className="bg-gray-900 text-white font-bold border-none z-[100]">
                  {product.isVisibleOnMenu ? "Ocultar do Cardápio" : "Exibir no Cardápio"}
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </div>

          {/* Promotion Settings Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid={`open-promotion-modal-${product.id}`}
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-colors",
                  isPromoCurrentlyActive ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:text-primary hover:border-primary/50"
                )}
                onClick={() => setIsPromotionModalOpen(true)}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent side="top" className="bg-primary text-white font-bold border-none z-[100]">
                Configurar Promoção Agendada
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </div>

        {/* Promotion Modal */}
        <Dialog open={isPromotionModalOpen} onOpenChange={setIsPromotionModalOpen}>
          <PromotionSettingsModal 
            product={product as any} 
            onOpenChange={setIsPromotionModalOpen} 
          />
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

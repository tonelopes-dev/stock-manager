"use client";

import { ProductDto } from "@/app/_data-access/product/get-products";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { ImageIcon } from "lucide-react";
import ProductStatusBadge from "@/app/_components/product-status-badge";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProductTableDropdownMenu from "./table-dropdown-menu";
import { UserRole } from "@prisma/client";
import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";
import * as React from "react";

interface ProductCardProps {
  product: ProductDto;
  userRole: UserRole;
  categories: ProductCategoryOption[];
  environments: EnvironmentOption[];
  overheadSettings: {
    enableOverheadInjection: boolean;
    overheadRate: number;
  } | null;
}

const PRODUCT_TYPE_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "premium" }
> = {
  REVENDA: { label: "Revenda", variant: "secondary" },
  PRODUCAO_PROPRIA: { label: "Produção Própria", variant: "default" },
  COMBO: { label: "Combo", variant: "premium" as any },
  INSUMO: { label: "Insumo", variant: "outline" as any },
};

export const ProductCard = ({ product, userRole, categories, environments, overheadSettings }: ProductCardProps) => {
  const router = useRouter();
  const [hasError, setHasError] = React.useState(false);
  
  const typeConfig = PRODUCT_TYPE_LABELS[product.type] || PRODUCT_TYPE_LABELS.REVENDA;

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") || 
      target.closest("[role='menuitem']") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest("[role='dialog']")
    ) return;
    
    router.push(`/cardapio/${product.id}`);
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-none bg-muted/50 flex flex-row h-[180px]"
      onClick={handleClick}
      data-testid="product-card"
    >
      <div className="relative w-44 shrink-0 bg-muted flex items-center justify-center overflow-hidden border-r border-border/50">
        {product.imageUrl && !hasError ? (
          <Image 
            src={product.imageUrl} 
            alt={product.name} 
            fill 
            className="object-cover"
            sizes="200px"
            quality={80}
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="w-8 h-8 opacity-50" />
            <span className="text-[8px] font-bold uppercase tracking-tight">
              {hasError ? "Erro" : "Sem foto"}
            </span>
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          <Badge 
            variant={typeConfig.variant as any} 
            className="shadow-sm border-none backdrop-blur-md bg-background/80 text-[10px] py-0 px-2 h-5 flex items-center justify-center"
          >
            {typeConfig.label}
          </Badge>
          {!product.isActive && (
            <Badge variant="destructive" className="shadow-sm border-none backdrop-blur-md opacity-90 text-[10px] py-0 px-2 h-5">
              Inativo
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-1 min-w-0 justify-between">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-base text-foreground truncate" title={product.name}>
              {product.name}
            </h3>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5 truncate">
                {product.category?.name || "Sem categoria"}
                {product.environment && (
                  <>
                    <span className="mx-1.5 opacity-50">|</span>
                    <span className="text-primary/70">{product.environment.name}</span>
                  </>
                )}
            </p>
          </div>
          <div className="shrink-0">
            <ProductTableDropdownMenu 
                product={product} 
                userRole={userRole} 
                categories={categories}
                environments={environments}
                overheadSettings={overheadSettings}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 py-2 border-y border-border/50">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-tight">Venda</span>
            <p className="font-bold text-sm text-foreground">
              {Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(product.price)}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-tight">Margem</span>
            <p className="font-bold text-sm text-emerald-600">
                {product.margin}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-tight">
                  {product.isMadeToOrder ? "Virtual" : "Estoque"}:
                </span>
                <p className="text-sm font-bold text-foreground">
                    {product.isMadeToOrder ? product.virtualStock : product.stock} <span className="text-[10px] text-muted-foreground font-medium uppercase">{product.unit}</span>
                </p>
            </div>
            {!product.isMadeToOrder && (
              <ProductStatusBadge status={product.status} />
            )}
        </div>
      </CardContent>
    </Card>
  );
};

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
}

const PRODUCT_TYPE_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  RESELL: { label: "Revenda", variant: "secondary" },
  PREPARED: { label: "Produção Própria", variant: "default" },
};

export const ProductCard = ({ product, userRole, categories, environments }: ProductCardProps) => {
  const router = useRouter();
  const [hasError, setHasError] = React.useState(false);
  const typeConfig = PRODUCT_TYPE_LABELS[product.type] || PRODUCT_TYPE_LABELS.RESELL;

  const handleClick = (e: React.MouseEvent) => {
    // Prevent redirect if clicking on the dropdown or other interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") || 
      target.closest("[role='menuitem']") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest("[role='dialog']")
    ) return;
    
    router.push(`/products/${product.id}`);
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-none bg-slate-50/50"
      onClick={handleClick}
    >
      <div className="relative aspect-square bg-slate-200 flex items-center justify-center overflow-hidden">
        {product.imageUrl && !hasError ? (
          <Image 
            src={product.imageUrl} 
            alt={product.name} 
            fill 
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={80}
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImageIcon className="w-10 h-10" />
            <span className="text-[10px] font-bold uppercase tracking-tight">
              {hasError ? "Imagem indisponível" : "Sem imagem"}
            </span>
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge variant={typeConfig.variant} className="shadow-sm border-none backdrop-blur-md bg-white/80 text-foreground">
            {typeConfig.label}
          </Badge>
          {!product.isActive && (
            <Badge variant="destructive" className="shadow-sm border-none backdrop-blur-md opacity-90">
              Inativo
            </Badge>
          )}
        </div>

        <div className="absolute top-2 right-2">
            <ProductTableDropdownMenu 
                product={product} 
                userRole={userRole} 
                categories={categories}
                environments={environments}
            />
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        <div>
            <h3 className="font-bold text-base text-slate-900 line-clamp-1" title={product.name}>
            {product.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">
                {product.category?.name || "Sem categoria"}
                {product.environment && (
                  <>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-primary/70">{product.environment.name}</span>
                  </>
                )}
            </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-100">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Valor Unitário</span>
            <p className="font-bold text-slate-900">
              {Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(product.price)}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Margem</span>
            <p className="font-bold text-emerald-600">
                {product.margin}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">Estoque</span>
                <p className="text-sm font-semibold text-slate-700">
                    {product.stock} un
                </p>
            </div>
            <ProductStatusBadge status={product.status} />
        </div>
      </CardContent>
    </Card>
  );
};

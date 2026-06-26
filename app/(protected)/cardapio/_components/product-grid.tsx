"use client";

import { use, useState, useEffect } from "react";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { ProductCard } from "./product-card";
import { UserRole } from "@prisma/client";
import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";
import { Badge } from "@/app/_components/ui/badge";
import { SearchIcon, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

interface ProductGridProps {
  productsPromise: Promise<ProductDto[]>;
  search: string;
  sortBy: string;
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  userRole: UserRole;
  categories: ProductCategoryOption[];
  environments: EnvironmentOption[];
  overheadSettings: {
    enableOverheadInjection: boolean;
    overheadRate: number;
  } | null;
}

export const ProductGrid = ({
  productsPromise,
  search,
  sortBy,
  selectedCategoryId,
  setSelectedCategoryId,
  userRole,
  categories,
  environments,
  overheadSettings,
}: ProductGridProps) => {
  const productsResult = use(productsPromise);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, search]);

  const filteredProducts = productsResult.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategoryId === "all" || p.category?.id === selectedCategoryId;

    return matchesSearch && matchesCategory;
  });

  if (sortBy === "latest") {
    filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === "low-stock") {
    filteredProducts.sort((a, b) => a.stock - b.stock);
  } else if (sortBy === "price-asc") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const categoryName = product.category?.name || "Sem Categoria";
    const categoryId = product.category?.id || "all";
    if (!acc[categoryName]) {
      acc[categoryName] = { categoryId, items: [] };
    }
    acc[categoryName].items.push(product);
    return acc;
  }, {} as Record<string, { categoryId: string; items: ProductDto[] }>);

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
        <div className="p-4 rounded-full bg-muted">
          <SearchIcon className="w-10 h-10 opacity-20" />
        </div>
        <p className="text-lg font-medium">Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {Object.entries(groupedProducts).map(([category, { categoryId, items }]) => {
        const isAllView = selectedCategoryId === "all";
        const displayedItems = isAllView
          ? items.slice(0, 3)
          : items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        const totalPages = Math.ceil(items.length / pageSize);

        return (
          <div key={category} className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">{category}</h2>
              <div className="h-px flex-1 bg-muted rounded-full" />
              <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-bold px-3">
                {items.length} {items.length === 1 ? "un" : "un"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedItems.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  userRole={userRole}
                  categories={categories}
                  environments={environments}
                  overheadSettings={overheadSettings}
                />
              ))}
            </div>

            {/* Ver mais produtos (Modo Tudo) */}
            {isAllView && items.length > 3 && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setSelectedCategoryId(categoryId)}
                  className="group flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary transition-all hover:text-primary/80 active:scale-95"
                >
                  Ver mais produtos ({items.length - 3})
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            )}

            {/* Paginação (Modo Categoria Específica) */}
            {!isAllView && items.length > pageSize && (
              <div className="flex items-center justify-between border-t border-border pt-6 mt-6">
                <p className="text-xs font-bold text-muted-foreground">
                  Mostrando <span className="text-foreground font-black">{(currentPage - 1) * pageSize + 1}</span> a <span className="text-foreground font-black">{Math.min(currentPage * pageSize, items.length)}</span> de <span className="text-foreground font-black">{items.length}</span> produtos
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-3 text-xs font-bold gap-1 rounded-xl shadow-sm"
                  >
                    <ChevronLeft size={14} />
                    Anterior
                  </Button>
                  <div className="bg-muted px-3 py-1.5 rounded-xl text-xs font-black text-foreground">
                    {currentPage} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 text-xs font-bold gap-1 rounded-xl shadow-sm"
                  >
                    Próxima
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

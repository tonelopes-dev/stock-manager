"use client";

import { ProductDto } from "@/app/_data-access/product/get-products";
import { UserRole } from "@prisma/client";
import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";
import { useState, useMemo } from "react";
import { Input } from "@/app/_components/ui/input";
import { SearchIcon, ArrowDownWideNarrow } from "lucide-react";
import { ProductCard } from "./product-card";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";

interface ProductVisualCatalogProps {
  products: ProductDto[];
  userRole: UserRole;
  categories: ProductCategoryOption[];
}

type SortOption = "latest" | "low-stock" | "price-asc" | "price-desc";

export const ProductVisualCatalog = ({
  products,
  userRole,
  categories,
}: ProductVisualCatalogProps) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");

  const filteredProducts = useMemo(() => {
    let result = [...products].filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    );

    if (sortBy === "latest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "low-stock") {
      result.sort((a, b) => a.stock - b.stock);
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, search, sortBy]);

  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      const categoryName = product.category?.name || "Sem Categoria";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    }, {} as Record<string, ProductDto[]>);
  }, [filteredProducts]);

  const sortLabels: Record<SortOption, string> = {
    latest: "Mais recentes",
    "low-stock": "Menor estoque",
    "price-asc": "Menor preço",
    "price-desc": "Maior preço",
  };

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="relative w-full md:w-96">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar produto por nome ou SKU..."
            className="pl-10 bg-white border-none shadow-sm h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 gap-2 bg-white shadow-sm border-none min-w-[180px] justify-between">
                <div className="flex items-center gap-2">
                    <ArrowDownWideNarrow className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">Ordenar: {sortLabels[sortBy]}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Ordenação</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy("latest")}>Mais recentes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("low-stock")}>Menor estoque</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-asc")}>Menor preço</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-desc")}>Maior preço</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Categories Sections */}
      {Object.keys(groupedProducts).length > 0 ? (
        Object.entries(groupedProducts).map(([category, items]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{category}</h2>
                <div className="h-px flex-1 bg-slate-100 rounded-full" />
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold px-3">
                    {items.length} {items.length === 1 ? 'un' : 'un'}
                </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  userRole={userRole} 
                  categories={categories} 
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <div className="p-4 rounded-full bg-slate-50">
                <SearchIcon className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-lg font-medium">Nenhum produto encontrado</p>
        </div>
      )}
    </div>
  );
};

"use client";

import { use } from "react";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { ProductCard } from "./product-card";
import { UserRole } from "@prisma/client";
import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";
import { Badge } from "@/app/_components/ui/badge";
import { SearchIcon } from "lucide-react";

interface ProductGridProps {
  productsPromise: Promise<ProductDto[]>;
  search: string;
  sortBy: string;
  selectedCategoryId: string;
  userRole: UserRole;
  categories: ProductCategoryOption[];
  environments: EnvironmentOption[];
}

export const ProductGrid = ({
  productsPromise,
  search,
  sortBy,
  selectedCategoryId,
  userRole,
  categories,
  environments,
}: ProductGridProps) => {
  const products = use(productsPromise);

  const filteredProducts = products.filter((p) => {
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
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, ProductDto[]>);

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
        <div className="p-4 rounded-full bg-slate-50">
          <SearchIcon className="w-10 h-10 opacity-20" />
        </div>
        <p className="text-lg font-medium">Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedProducts).map(([category, items]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{category}</h2>
            <div className="h-px flex-1 bg-slate-100 rounded-full" />
            <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold px-3">
              {items.length} {items.length === 1 ? "un" : "un"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                userRole={userRole}
                categories={categories}
                environments={environments}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

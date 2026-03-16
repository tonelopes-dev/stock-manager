"use client";

import { ProductDto } from "@/app/_data-access/product/get-products";
import { UserRole } from "@prisma/client";
import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/app/_components/ui/input";
import { SearchIcon, ArrowDownWideNarrow, ChevronsUpDown } from "lucide-react";
import { ProductCard } from "./product-card";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { PlusIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";

import { CategoryManagementDialog } from "./category-management-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";

import { Suspense } from "react";
import { ProductGrid } from "./product-grid";
import { ProductGridSkeleton } from "./product-grid-skeleton";
import { EnvironmentFilter } from "./environment-filter";

interface ProductVisualCatalogProps {
  productsPromise: Promise<ProductDto[]>;
  userRole: UserRole;
  categories: ProductCategoryOption[];
  environments: EnvironmentOption[];
}

type SortOption = "latest" | "low-stock" | "price-asc" | "price-desc";

export const ProductVisualCatalog = ({
  productsPromise,
  userRole,
  categories,
  environments,
}: ProductVisualCatalogProps) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

  // Reset category filter when category list changes (e.g. environment change)
  useEffect(() => {
    if (selectedCategoryId !== "all") {
        const categoryExists = categories.some(cat => cat.id === selectedCategoryId);
        if (!categoryExists) {
            setSelectedCategoryId("all");
        }
    }
  }, [categories, selectedCategoryId]);

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
          <EnvironmentFilter environments={environments} />

          {/* Sort Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 gap-2 bg-white shadow-sm border-none min-w-[200px] justify-between px-4">
                <div className="flex items-center gap-2">
                    <ArrowDownWideNarrow className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700 whitespace-nowrap">Ordenar: {sortLabels[sortBy]}</span>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-slate-400 opacity-50" />
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

      {/* Category Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-1 rounded-xl">
        <Tabs defaultValue="all" value={selectedCategoryId} onValueChange={setSelectedCategoryId} className="flex-1">
          <TabsList className="bg-slate-50 border border-slate-100 h-11 p-1">
            <TabsTrigger 
              value="all" 
              className="px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Tudo
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {(userRole === "ADMIN" || userRole === "OWNER") && (
          <div className="flex gap-2">
            <CategoryManagementDialog categories={categories} />
          </div>
        )}
      </div>

      {/* Product List with Suspense */}
      <Suspense key={`${search}-${sortBy}-${selectedCategoryId}`} fallback={<ProductGridSkeleton />}>
        <ProductGrid 
          productsPromise={productsPromise}
          search={search}
          sortBy={sortBy}
          selectedCategoryId={selectedCategoryId}
          userRole={userRole}
          categories={categories}
          environments={environments}
        />
      </Suspense>
    </div>
  );
};

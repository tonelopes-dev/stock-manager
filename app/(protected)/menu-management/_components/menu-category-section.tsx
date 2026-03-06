"use client";

import { MenuProductCard } from "./menu-product-card";
import { Badge } from "@/app/_components/ui/badge";
import { Layers } from "lucide-react";
import type { MenuManagementCategory } from "@/app/_data-access/menu/get-menu-management-data";

interface MenuCategorySectionProps {
  category: MenuManagementCategory;
}

export const MenuCategorySection = ({ category }: MenuCategorySectionProps) => {
  const visibleCount = category.products.filter(
    (p) => p.isVisibleOnMenu,
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
          {category.icon ? (
            <span className="text-base">{category.icon}</span>
          ) : (
            <Layers className="h-4 w-4 text-slate-500" />
          )}
          <h3 className="text-sm font-black text-slate-700">{category.name}</h3>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold">
          {visibleCount}/{category.products.length} visíveis
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {category.products.map((product) => (
          <MenuProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";

export const CustomerCategoryFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "ALL";

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    router.push(`/customers?${params.toString()}`);
  };

  return (
    <Select value={currentCategory} onValueChange={handleCategoryChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por categoria" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Todas as categorias</SelectItem>
        <SelectItem value="LEAD">Leads</SelectItem>
        <SelectItem value="REGULAR">Regulares</SelectItem>
        <SelectItem value="VIP">VIPs</SelectItem>
        <SelectItem value="INACTIVE">Inativos</SelectItem>
      </SelectContent>
    </Select>
  );
};

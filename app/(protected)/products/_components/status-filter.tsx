"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";

export const ProductStatusFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "ACTIVE";

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ACTIVE") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/products?${params.toString()}`);
  };

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE">Ativos</SelectItem>
        <SelectItem value="INACTIVE">Inativos</SelectItem>
        <SelectItem value="ALL">Todos</SelectItem>
      </SelectContent>
    </Select>
  );
};

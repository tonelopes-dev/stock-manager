"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";
import { LayoutGridIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { QuickEnvironmentDialog } from "./quick-environment-dialog";
import { SelectSeparator } from "@/app/_components/ui/select";

interface EnvironmentFilterProps {
  environments: EnvironmentOption[];
}

export const EnvironmentFilter = ({ environments }: EnvironmentFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const currentEnv = searchParams.get("environmentId") || "all";

  const handleEnvChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset category when environment changes as requested
    params.delete("categoryId");
    
    if (value === "all") {
      params.delete("environmentId");
    } else {
      params.set("environmentId", value);
    }
    
    router.push(`/products?${params.toString()}`);
  };

  return (
    <>
    <Select value={currentEnv} onValueChange={handleEnvChange}>
      <SelectTrigger className="h-11 gap-2 bg-white shadow-sm border-none min-w-[180px] justify-between">
        <div className="flex items-center gap-2">
            <LayoutGridIcon className="w-4 h-4 text-slate-500" />
            <SelectValue placeholder="Todos Ambientes" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos Ambientes</SelectItem>
        {environments.map((env) => (
          <SelectItem key={env.id} value={env.id}>
            {env.name}
          </SelectItem>
        ))}
        <SelectSeparator />
        <div 
          className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-primary font-medium"
          onClick={(e) => {
            e.stopPropagation();
            setIsDialogOpen(true);
          }}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Criar novo ambiente
        </div>
      </SelectContent>
    </Select>
    <QuickEnvironmentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};

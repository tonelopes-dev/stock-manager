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
    if (value === "create") {
      setIsDialogOpen(true);
      return;
    }

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
      <SelectTrigger className="h-11 gap-2 bg-background shadow-sm border-none min-w-[180px] justify-between">
        <div className="flex items-center gap-2">
            <LayoutGridIcon className="w-4 h-4 text-muted-foreground" />
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
        <SelectItem
          value="create"
          className="text-primary font-medium focus:text-primary focus:bg-muted cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Criar novo ambiente
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
    <QuickEnvironmentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};

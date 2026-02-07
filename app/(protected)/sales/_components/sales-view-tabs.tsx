"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { LayoutDashboardIcon, TableIcon } from "lucide-react";

export function SalesViewTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "gestao";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <Tabs value={currentView} onValueChange={handleTabChange} className="w-[300px]">
      <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
        <TabsTrigger 
            value="gestao" 
            className="flex items-center gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary"
        >
          <TableIcon className="h-3.5 w-3.5" />
          Gestão
        </TabsTrigger>
        <TabsTrigger 
            value="inteligencia" 
            className="flex items-center gap-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-primary"
        >
          <LayoutDashboardIcon className="h-3.5 w-3.5" />
          Inteligência
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

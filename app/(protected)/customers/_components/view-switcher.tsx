"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { LayoutList, LayoutDashboard } from "lucide-react";
import { TransitionStartFunction } from "react";

interface CustomerViewSwitcherProps {
  startTransition: TransitionStartFunction;
}

export const CustomerViewSwitcher = ({
  startTransition,
}: CustomerViewSwitcherProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "table";

  const handleViewChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", value);

    startTransition(() => {
      router.push(`/customers?${params.toString()}`);
    });
  };

  return (
    <Tabs
      value={currentView}
      onValueChange={handleViewChange}
      className="w-auto"
    >
      <TabsList className="bg-slate-100/50">
        <TabsTrigger
          value="table"
          className="gap-2 text-[10px] font-black uppercase italic tracking-tighter data-[state=active]:bg-white data-[state=active]:text-primary"
        >
          <LayoutList className="h-3 w-3" />
          Tabela
        </TabsTrigger>
        <TabsTrigger
          value="kanban"
          className="gap-2 text-[10px] font-black uppercase italic tracking-tighter data-[state=active]:bg-white data-[state=active]:text-primary"
        >
          <LayoutDashboard className="h-3 w-3" />
          Funil (CRM)
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

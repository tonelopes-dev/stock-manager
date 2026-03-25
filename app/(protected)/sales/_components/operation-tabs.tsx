"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { UtensilsIcon, BikeIcon } from "lucide-react";
import { cn } from "@/app/_lib/utils";

interface OperationTabsProps {
  pendingDeliveryCount?: number;
}

export function OperationTabs({ pendingDeliveryCount = 0 }: OperationTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dinein";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="mb-6 grid w-full max-w-[400px] grid-cols-2 bg-muted p-1">
        <TabsTrigger
          value="dinein"
          className="flex items-center gap-2 text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-primary"
        >
          <UtensilsIcon className="h-4 w-4" />
          Salão / Comandas
        </TabsTrigger>
        <TabsTrigger
          value="delivery"
          className="relative flex items-center gap-2 text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-primary"
        >
          <BikeIcon className="h-4 w-4" />
          Delivery / iFood
          {pendingDeliveryCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg animate-pulse ring-2 ring-background">
              {pendingDeliveryCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

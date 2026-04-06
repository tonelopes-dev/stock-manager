"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { TransitionStartFunction } from "react";

interface CustomerJourneyFilterProps {
  startTransition: TransitionStartFunction;
}

export const CustomerJourneyFilter = ({
  startTransition,
}: CustomerJourneyFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentJourney = searchParams.get("journey") || "all";

  const handleJourneyChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("journey");
    } else {
      params.set("journey", value);
    }

    startTransition(() => {
      router.push(`/customers?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <Tabs
      value={currentJourney}
      onValueChange={handleJourneyChange}
      className="w-auto"
    >
      <TabsList className="bg-transparent h-auto p-0 gap-6">
        <TabsTrigger
          value="all"
          className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-2 text-xs font-black uppercase italic tracking-tighter text-muted-foreground transition-all duration-300 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          Todos
        </TabsTrigger>
        <TabsTrigger
          value="with"
          className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-2 text-xs font-black uppercase italic tracking-tighter text-muted-foreground transition-all duration-300 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          Com jornada
        </TabsTrigger>
        <TabsTrigger
          value="without"
          className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-2 text-xs font-black uppercase italic tracking-tighter text-muted-foreground transition-all duration-300 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          Sem jornada
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

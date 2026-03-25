"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncIfoodCatalogAction } from "@/app/_actions/ifood/sync-catalog";
import { toast } from "sonner";
import { cn } from "@/app/_lib/utils";

interface IfoodSyncButtonProps {
  className?: string;
}

export const IfoodSyncButton = ({ className }: IfoodSyncButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    try {
      setIsLoading(true);
      const result = await syncIfoodCatalogAction();

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao tentar sincronizar com o iFood.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isLoading}
      className={cn("gap-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700", className)}
    >
      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
      {isLoading ? "Sincronizando..." : "Sincronizar iFood"}
    </Button>
  );
};

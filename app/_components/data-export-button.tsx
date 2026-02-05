"use client";

import { Button } from "@/app/_components/ui/button";
import { DownloadIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

interface DataExportButtonProps {
    label?: string;
    endpoint?: string;
}

export const DataExportButton = ({ 
    label = "Exportar CSV", 
    endpoint = "/api/sales/export" 
}: DataExportButtonProps) => {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const from = searchParams.get("from") || "";
      const to = searchParams.get("to") || "";
      
      const query = new URLSearchParams();
      if (from) query.set("from", from);
      if (to) query.set("to", to);

      const url = `${endpoint}?${query.toString()}`;
      
      // Trigger download
      window.location.href = url;
      
      toast.success("Exportação iniciada!");
    } catch (error) {
      toast.error("Erro ao exportar dados.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="font-bold border-slate-200 hover:bg-slate-50 transition-all gap-2 h-9 px-4 rounded-lg shadow-sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      <DownloadIcon size={15} className="text-slate-500" />
      <span className="text-xs">{isExporting ? "Gerando..." : label}</span>
    </Button>
  );
};

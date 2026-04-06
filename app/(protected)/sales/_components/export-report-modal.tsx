"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { DownloadIcon, FileSpreadsheetIcon, Loader2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const ExportReportModal = () => {
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);

  const from = searchParams.get("from") || new Date().toISOString().split("T")[0];
  const to = searchParams.get("to") || new Date().toISOString().split("T")[0];

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const query = new URLSearchParams();
      query.set("from", from);
      query.set("to", to);

      const url = `/api/sales/export/xlsx?${query.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `relatorio-vendas-operacional-${from}-a-${to}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("Seu relatório operacional foi gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Ocorreu um erro ao gerar o relatório.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 transition-all font-semibold shadow-sm h-9 px-4 gap-2 rounded-lg"
        >
          <FileSpreadsheetIcon size={16} />
          Exportar XLSX
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <div className="p-1.5 bg-emerald-50 rounded-md">
              <FileSpreadsheetIcon size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Relatório Operacional</span>
          </div>
          <DialogTitle className="text-xl">Exportação de Resultados</DialogTitle>
          <DialogDescription>
            Gere uma planilha detalhada com o agrupamento de produtos vendidos no período selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="bg-muted/50 rounded-xl p-4 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-lg border border-border text-muted-foreground">
                <CalendarIcon size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Período de Extração</p>
                <p className="text-sm font-bold text-foreground">
                  {formatDate(from)} até {formatDate(to)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
            <div className="text-emerald-600 shrink-0 mt-0.5">
              <DownloadIcon size={18} />
            </div>
            <div>
              <p className="text-xs text-emerald-800 font-bold mb-0.5">O que levará no arquivo?</p>
              <ul className="text-[11px] text-emerald-700 space-y-1 list-disc ml-4">
                <li>Lista de produtos vendidos (Totalizado)</li>
                <li>Volume de saídas por item</li>
                <li>Estoque atual no momento da extração</li>
                <li>Resumo de Faturamento e Gorjetas</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleExport} 
            disabled={isGenerating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold h-11 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Gerando Planilha...
              </>
            ) : (
              "Baixar Relatório XLSX"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


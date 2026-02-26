"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Badge } from "@/app/_components/ui/badge";
import { DownloadIcon, FileSpreadsheetIcon, Loader2, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/_lib/utils";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export const ExportReportModal = () => {
  const [selectedPeriods, setSelectedPeriods] = useState<{ month: number; year: number }[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>("1");
  const [currentYear, setCurrentYear] = useState<string>(new Date().getFullYear().toString());
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddPeriod = () => {
    const monthNum = parseInt(currentMonth);
    const yearNum = parseInt(currentYear);
    
    const exists = selectedPeriods.some(p => p.month === monthNum && p.year === yearNum);
    if (exists) {
      toast.info("Este período já foi adicionado.");
      return;
    }

    setSelectedPeriods([...selectedPeriods, { month: monthNum, year: yearNum }]);
  };

  const handleRemovePeriod = (index: number) => {
    setSelectedPeriods(selectedPeriods.filter((_, i) => i !== index));
  };

  const handleExport = async () => {
    if (selectedPeriods.length === 0) {
      toast.error("Selecione pelo menos um período.");
      return;
    }

    setIsGenerating(true);
    try {
      const query = new URLSearchParams();
      selectedPeriods.forEach(p => {
        query.append("p", `${p.month}-${p.year}`);
      });

      const url = `/api/sales/export/xlsx?${query.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `relatorio-vendas-${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("Seu relatório foi gerado com sucesso!");
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
          Relatório XLSX
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <div className="p-1.5 bg-emerald-50 rounded-md">
              <FileSpreadsheetIcon size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Módulo de Exportação</span>
          </div>
          <DialogTitle className="text-xl">Exportação Financeira</DialogTitle>
          <DialogDescription>
            Escolha os períodos desejados para compor sua planilha profissional de contabilidade e gestão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium text-slate-700">Adicionar Período</h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={currentMonth} onValueChange={setCurrentMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => (
                      <SelectItem key={m} value={(i + 1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={currentYear} onValueChange={setCurrentYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="button" 
                variant="secondary" 
                size="icon" 
                onClick={handleAddPeriod}
                className="shrink-0 bg-slate-100 hover:bg-slate-200 border border-slate-200"
              >
                <PlusIcon size={18} />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700">Períodos Selecionados ({selectedPeriods.length})</h4>
              {selectedPeriods.length > 0 && (
                <button 
                  onClick={() => setSelectedPeriods([])}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Limpar tudo
                </button>
              )}
            </div>
            
            <div className={cn(
               "min-h-[100px] border-2 border-dashed rounded-lg p-3 flex flex-wrap gap-2 items-start transition-colors",
               selectedPeriods.length === 0 ? "bg-slate-50/50 border-slate-200 items-center justify-center font-medium" : "bg-white border-slate-200"
            )}>
              {selectedPeriods.length === 0 ? (
                <span className="text-[11px] text-slate-400">Nenhum mês adicionado para exportação</span>
              ) : (
                selectedPeriods.map((period, index) => (
                  <Badge 
                    key={`${period.month}-${period.year}`} 
                    variant="secondary" 
                    className="pl-3 pr-1 py-1 gap-2 flex items-center bg-slate-100 border-slate-200 text-slate-700 text-xs hover:bg-slate-200 transition-all animate-in fade-in zoom-in-95 duration-200"
                  >
                    {months[period.month - 1]}/{period.year}
                    <button 
                      onClick={() => handleRemovePeriod(index)}
                      className="hover:bg-slate-300 rounded-full p-0.5 ml-1 transition-colors"
                    >
                      <XIcon size={12} />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {selectedPeriods.length > 1 && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="text-emerald-600 shrink-0 mt-0.5">
                <FileSpreadsheetIcon size={18} />
              </div>
              <div>
                <p className="text-xs text-emerald-800 font-bold mb-0.5">Relatório Inteligente Ativado</p>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Detectamos múltiplos períodos. Sua planilha incluirá automaticamente uma aba de **Comparativo Mensal** e **Gráficos de Tendência**.
                </p>
              </div>
            </div>
          )}

          {selectedPeriods.length <= 1 && (
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
              <div className="text-blue-600 shrink-0 mt-0.5">
                <DownloadIcon size={18} />
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Dica:</strong> Adicione mais de um período para gerar automaticamente a aba de comparativos e gráficos de crescimento.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            onClick={handleExport} 
            disabled={isGenerating || selectedPeriods.length === 0}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold h-11 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Preparando Arquivo...
              </>
            ) : (
              "Gerar Relatório XLSX Profissional"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

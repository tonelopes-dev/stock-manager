"use client";

import { formatCurrencyBR } from "@/app/(protected)/_components/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CoinsIcon } from "lucide-react";

interface TipsReportProps {
  sales: any[];
  totalTips: number;
}

export function TipsReport({ sales, totalTips }: TipsReportProps) {
  const salesWithTips = sales.filter((s) => Number(s.tipAmount) > 0);

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CoinsIcon size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase italic tracking-tighter text-slate-400">
              Total de Gorjetas Acumuladas
            </p>
            <h3 className="text-2xl font-black tracking-tighter text-slate-900">
              {formatCurrencyBR(totalTips)}
            </h3>
          </div>
        </div>
        <div className="text-right">
             <p className="text-[10px] font-black uppercase italic tracking-tighter text-slate-400">
              Vendas com Gorjeta
            </p>
            <p className="text-lg font-bold text-slate-900">
                {salesWithTips.length} transações
            </p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-slate-500">Data e Hora</TableHead>
              <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-slate-500">Cliente</TableHead>
              <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-slate-500">Forma Pag.</TableHead>
              <TableHead className="h-11 text-right text-[10px] font-black uppercase tracking-wider text-slate-500">Valor Venda</TableHead>
              <TableHead className="h-11 text-right text-[10px] font-black uppercase tracking-wider text-slate-500">Gorjeta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesWithTips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-xs font-bold text-slate-400 italic">
                  Nenhuma gorjeta registrada para o período selecionado.
                </TableCell>
              </TableRow>
            ) : (
              salesWithTips.map((sale) => (
                <TableRow key={sale.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-4 text-xs font-bold text-slate-600">
                    {format(new Date(sale.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-black text-slate-900">
                    {sale.customerName || "Venda Avulsa"}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-bold text-slate-500">
                    {sale.paymentMethod}
                  </TableCell>
                  <TableCell className="py-4 text-right text-xs font-bold text-slate-500">
                    {formatCurrencyBR(Number(sale.totalAmount))}
                  </TableCell>
                  <TableCell className="py-4 text-right text-xs font-black text-primary">
                    {formatCurrencyBR(Number(sale.tipAmount))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

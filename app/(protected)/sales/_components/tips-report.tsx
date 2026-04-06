"use client";

import { formatCurrencyBR } from "@/app/(protected)/_components/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CoinsIcon } from "lucide-react";

const paymentMethodDisplayLabels: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "PIX",
  CREDIT_CARD: "Crédito",
  DEBIT_CARD: "Débito",
  OTHER: "Outro",
};

interface TipsReportProps {
  sales: any[];
  totalTips: number;
}

export function TipsReport({ sales, totalTips }: TipsReportProps) {
  const salesWithTips = sales.filter((s) => Number(s.tipAmount) > 0);

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CoinsIcon size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
              Total de Gorjetas Acumuladas
            </p>
            <h3 className="text-2xl font-black tracking-tighter text-foreground">
              {formatCurrencyBR(totalTips)}
            </h3>
          </div>
        </div>
        <div className="text-right">
             <p className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
              Vendas com Gorjeta
            </p>
            <p className="text-lg font-bold text-foreground">
                {salesWithTips.length} transações
            </p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Data e Hora</TableHead>
              <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Cliente</TableHead>
              <TableHead className="h-11 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Forma Pag.</TableHead>
              <TableHead className="h-11 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">Valor Venda</TableHead>
              <TableHead className="h-11 text-right text-[10px] font-black uppercase tracking-wider text-muted-foreground">Gorjeta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesWithTips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-xs font-bold text-muted-foreground italic">
                  Nenhuma gorjeta registrada para o período selecionado.
                </TableCell>
              </TableRow>
            ) : (
              salesWithTips.map((sale) => (
                <TableRow key={sale.id} className="border-border hover:bg-muted/50 transition-colors">
                  <TableCell className="py-4 text-xs font-bold text-muted-foreground">
                    {format(new Date(sale.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-black text-foreground">
                    {sale.customerName || "Venda Avulsa"}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-bold text-muted-foreground">
                    {paymentMethodDisplayLabels[sale.paymentMethod] || sale.paymentMethod}
                  </TableCell>
                  <TableCell className="py-4 text-right text-xs font-bold text-muted-foreground">
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

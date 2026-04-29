"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { formatCurrency } from "@/app/_lib/utils";
import { AggregatedSaleDto } from "@/app/_data-access/sale/get-aggregated-sales";
import { Badge } from "@/app/_components/ui/badge";

interface AggregatedSalesTableProps {
  data: AggregatedSaleDto[];
}

export const AggregatedSalesTable = ({ data }: AggregatedSalesTableProps) => {
  return (
    <Card className="border-none shadow-sm bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-foreground">
          Detalhamento por Produto
        </CardTitle>
        <CardDescription className="text-xs font-semibold uppercase text-muted-foreground">
          Visão agregada de itens vendidos, custos e lucratividade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border bg-background">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground italic h-10">
                  Produto
                </TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground italic h-10">
                  Qtd Vendida
                </TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground italic h-10">
                  Estoque Atual
                </TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground italic h-10">
                  Total Gerado
                </TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground italic h-10">
                  Custo Total
                </TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground italic h-10">
                  Lucro Bruto
                </TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground italic h-10">
                  Margem %
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground font-medium italic">
                    Nenhuma venda registrada no período selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const profit = item.totalRevenue - item.totalCost;
                  const margin = item.totalRevenue > 0 ? (profit / item.totalRevenue) * 100 : 0;

                  return (
                    <TableRow key={item.productId} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3">
                        <span className="font-black text-sm text-foreground tracking-tight italic uppercase">
                          {item.productName}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <Badge variant="secondary" className="font-black text-xs text-primary px-3 py-0.5 rounded-full bg-muted border-none ring-1 ring-border/50">
                          {item.qtySold}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <span className={`font-black text-xs tracking-tighter italic uppercase ${Number(item.currentStock) <= 10 ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {item.currentStock} und
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <span className="font-black text-sm text-foreground tracking-tighter italic uppercase">
                          {formatCurrency(item.totalRevenue)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <span className="font-bold text-xs text-muted-foreground tracking-tighter uppercase">
                          {formatCurrency(item.totalCost)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <span className={`font-black text-sm tracking-tighter italic uppercase ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {formatCurrency(profit)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <Badge variant="outline" className={`font-black text-[10px] px-2 py-0 border-none ring-1 ${margin >= 20 ? 'text-emerald-500 ring-emerald-500/30 bg-emerald-500/10' : 'text-orange-500 ring-orange-500/30 bg-orange-500/10'}`}>
                          {margin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

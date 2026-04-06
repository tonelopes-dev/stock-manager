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
          Visão agregada de itens vendidos e estoque remanescente
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground font-medium italic">
                    Nenhuma venda registrada no período selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

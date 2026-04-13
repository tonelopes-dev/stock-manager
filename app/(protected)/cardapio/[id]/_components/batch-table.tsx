import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { BoxIcon, CalendarIcon, TruckIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BatchTableProps {
  stockEntries: any[];
}

const BatchTable = ({ stockEntries }: BatchTableProps) => {
  if (stockEntries.length === 0) {
    return (
      <Card className="border-none bg-white shadow-sm rounded-[2.5rem]">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BoxIcon size={32} className="text-muted-foreground mb-4 opacity-50" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum lote registrado para este produto.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-white shadow-sm overflow-hidden rounded-[2.5rem]">
      <CardHeader>
        <CardTitle className="text-xl font-black flex items-center gap-2">
          <BoxIcon size={20} className="text-primary" />
          Lotes Ativos / Entradas Recentes
        </CardTitle>
        <CardDescription>Rastreabilidade de compras e validade</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold text-slate-900">Data</TableHead>
                <TableHead className="font-bold text-slate-900">Fornecedor</TableHead>
                <TableHead className="font-bold text-slate-900">Lote</TableHead>
                <TableHead className="font-bold text-slate-900">Validade</TableHead>
                <TableHead className="font-bold text-slate-900 text-right">Qtd Original</TableHead>
                <TableHead className="font-bold text-slate-900 text-right">Custo Unit.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(stockEntries || []).map((entry) => {
                const createdAt = entry.createdAt ? new Date(entry.createdAt) : null;
                const expirationDate = entry.expirationDate ? new Date(entry.expirationDate) : null;
                const isCreatedAtValid = createdAt && !isNaN(createdAt.getTime());
                const isExpirationValid = expirationDate && !isNaN(expirationDate.getTime());
                
                const unitCost = Number(entry.unitCost);
                const isUnitCostValid = !isNaN(unitCost) && isFinite(unitCost);

                return (
                  <TableRow key={entry.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-xs text-slate-600">
                      {isCreatedAtValid ? format(createdAt!, "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TruckIcon size={14} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-slate-700">
                          {entry.supplier?.name || "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-500 uppercase">
                      {entry.batchNumber || "—"}
                    </TableCell>
                    <TableCell>
                      {isExpirationValid ? (
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon size={12} className={expirationDate! < new Date() ? "text-destructive" : "text-amber-500"} />
                          <span className={`text-xs font-bold ${expirationDate! < new Date() ? "text-destructive" : "text-slate-700"}`}>
                            {format(expirationDate!, "dd/MM/yyyy")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Sem validade</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-slate-900">
                      {Number(entry.quantity || 0)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-primary">
                      {isUnitCostValid ? Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(unitCost) : "R$ 0,00"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchTable;

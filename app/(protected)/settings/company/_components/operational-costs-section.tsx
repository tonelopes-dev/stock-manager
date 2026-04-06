"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon, CalculatorIcon, DollarSignIcon, SaveIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { upsertFixedExpense, deleteFixedExpense } from "@/app/_actions/company/fixed-expenses";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/_components/ui/card";
import { toast } from "sonner";
import { NumericFormat } from "react-number-format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { bulkUpdateOperationalCosts } from "@/app/_actions/product/bulk-update-operational-costs";
import { Loader2Icon } from "lucide-react";

interface FixedExpense {
  id: string;
  name: string;
  value: number;
}

interface OperationalCostsSectionProps {
  fixedExpenses: FixedExpense[];
  estimatedMonthlyVolume: number;
}

export const OperationalCostsSection = ({ fixedExpenses, estimatedMonthlyVolume }: OperationalCostsSectionProps) => {
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState<number | undefined>(undefined);

  const { execute: executeUpsert, isPending: isUpserting } = useAction(upsertFixedExpense, {
    onSuccess: () => {
      toast.success("Despesa adicionada com sucesso!");
      setNewName("");
      setNewValue(undefined);
    },
    onError: () => toast.error("Erro ao adicionar despesa."),
  });

  const { execute: executeDelete, isPending: isDeleting } = useAction(deleteFixedExpense, {
    onSuccess: () => toast.success("Despesa removida."),
    onError: () => toast.error("Erro ao remover despesa."),
  });

  const { execute: executeBulkUpdate, isPending: isUpdatingBulk } = useAction(bulkUpdateOperationalCosts, {
    onSuccess: ({ data }) => {
      toast.success(`${data?.count} produtos atualizados com sucesso!`);
    },
    onError: () => toast.error("Erro ao atualizar catálogo em massa."),
  });

  const totalFixedExpenses = fixedExpenses.reduce((acc, curr) => acc + curr.value, 0);
  const overheadRate = estimatedMonthlyVolume > 0 ? totalFixedExpenses / estimatedMonthlyVolume : 0;

  const handleAdd = () => {
    if (!newName || newValue === undefined) return;
    executeUpsert({ name: newName, value: newValue });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-500/10 p-2 text-orange-500">
            <CalculatorIcon size={20} />
          </div>
          <div>
            <CardTitle className="text-xl font-black">Custos Operacionais Globais</CardTitle>
            <CardDescription>
              Liste suas despesas fixas mensais para calcular a taxa de rateio por produto.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form para Adicionar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-muted/30 p-4 rounded-xl border">
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-muted-foreground font-black">Nome da Despesa</label>
            <Input 
              placeholder="Ex: Aluguel, Luz, Internet..." 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-muted-foreground font-black">Valor Mensal</label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              onValueChange={(vals) => setNewValue(vals.floatValue)}
              value={newValue}
              placeholder="R$ 0,00"
            />
          </div>
          <Button onClick={handleAdd} disabled={isUpserting || !newName || newValue === undefined} className="gap-2 font-bold h-10">
            <PlusIcon size={18} />
            Adicionar Item
          </Button>
        </div>

        {/* Lista de Despesas */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Itens Cadastrados</h4>
          <div className="border rounded-xl divide-y overflow-hidden shadow-sm">
            {fixedExpenses.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm italic">
                Nenhuma despesa fixa cadastrada.
              </div>
            ) : (
              fixedExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-bold text-sm">{expense.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Custo fixo recorrente</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-black text-primary">
                      {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(expense.value)}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10 rounded-full" 
                      onClick={() => executeDelete({ id: expense.id })}
                      disabled={isDeleting}
                    >
                      <Trash2Icon size={18} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resumo Matemático */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border bg-primary/5 border-primary/20 flex flex-col justify-between shadow-sm">
            <div className="flex items-center gap-2 text-primary mb-2">
              <DollarSignIcon size={18} />
              <span className="text-[10px] font-black uppercase tracking-wider">Total de Custos Fixos</span>
            </div>
            <p className="text-2xl font-black text-primary">
              {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalFixedExpenses)}
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-green-500/5 border-green-500/20 flex flex-col justify-between shadow-sm">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CalculatorIcon size={18} />
              <span className="text-[10px] font-black uppercase tracking-wider">Taxa de Rateio (Overhead)</span>
            </div>
            <div>
              <p className="text-2xl font-black text-green-600">
                {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(overheadRate)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                Sugerido para cada novo produto (base: {estimatedMonthlyVolume} vendas/mês)
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Atualização em Massa */}
        <div className="pt-2 border-t flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 gap-2 text-primary border-primary/30 hover:bg-primary/10 font-bold transition-all"
                disabled={overheadRate <= 0}
              >
                <CalculatorIcon size={16} />
                Aplicar taxa de {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(overheadRate)} em todos os produtos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-xl">Confirmar Atualização em Massa?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Esta ação irá sobrescrever o campo **Custo Operacional** de **TODOS** os produtos do seu catálogo para o valor atual de <span className="font-bold text-foreground">{Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(overheadRate)}</span>.
                  <br /><br />
                  <span className="text-destructive font-semibold">Atenção:</span> Isso alterará instantaneamente a margem de lucro de todos os itens cadastrados. Esta operação não pode ser desfeita automaticamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-primary font-bold gap-2 min-w-[120px]"
                  onClick={() => executeBulkUpdate({ newRate: overheadRate })}
                  disabled={isUpdatingBulk}
                >
                  {isUpdatingBulk ? <Loader2Icon size={16} className="animate-spin" /> : <SaveIcon size={16} />}
                  Confirmar Atualização
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

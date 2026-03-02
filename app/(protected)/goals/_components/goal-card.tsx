"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { GoalDto } from "@/app/_data-access/goal/get-goals";
import { formatCurrency } from "@/app/_helpers/currency";
import {
  TargetIcon,
  TrendingUpIcon,
  CalendarIcon,
  PackageIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Button } from "@/app/_components/ui/button";
import { useState } from "react";
import { UpsertGoalDialogContent } from "./upsert-goal-dialog-content";
import { DeleteGoalDialogContent } from "./delete-goal-dialog-content";
import { Dialog } from "@/app/_components/ui/dialog";

interface GoalCardProps {
  goal: GoalDto;
  isAdmin: boolean;
  products: { id: string; name: string }[];
}

export const GoalCard = ({ goal, isAdmin, products }: GoalCardProps) => {
  const [upsertDialogOpen, setUpsertDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isProductGoal = goal.type === "PRODUCT";
  const progressColor =
    goal.progressPercentage >= 100
      ? "bg-emerald-500"
      : goal.progressPercentage >= 75
        ? "bg-blue-500"
        : goal.progressPercentage >= 50
          ? "bg-amber-500"
          : "bg-primary";

  return (
    <>
      <Card className="group relative overflow-hidden border-slate-200 bg-white transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-slate-50 p-1.5 text-slate-400 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                {isProductGoal ? (
                  <PackageIcon className="h-4 w-4" />
                ) : (
                  <TargetIcon className="h-4 w-4" />
                )}
              </div>
              <span className="max-w-[150px] truncate">{goal.name}</span>
            </div>
          </CardTitle>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {goal.period === "MONTHLY"
                ? "Mensal"
                : goal.period === "WEEKLY"
                  ? "Semanal"
                  : goal.period === "DAILY"
                    ? "Diário"
                    : "Custom"}
            </div>

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-slate-50"
                  >
                    <MoreHorizontalIcon className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem
                    onClick={() => setUpsertDialogOpen(true)}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <EditIcon className="h-3 w-3" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="cursor-pointer gap-2 text-xs text-red-600 focus:text-red-600"
                  >
                    <TrashIcon className="h-3 w-3" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                    Realizado
                  </span>
                  <span className="text-xl font-bold tabular-nums leading-none text-slate-900">
                    {formatCurrency(goal.currentValue)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                    Objetivo
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-slate-600">
                    {formatCurrency(Number(goal.targetValue))}
                  </span>
                </div>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all duration-500 ease-in-out ${progressColor}`}
                  style={{
                    width: `${Math.min(goal.progressPercentage, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex flex-col gap-0.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition-colors group-hover:bg-white">
                <span className="font-medium text-muted-foreground">
                  Progresso
                </span>
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <TrendingUpIcon
                    className={`h-3 w-3 ${goal.progressPercentage >= 100 ? "text-emerald-500" : "text-primary"}`}
                  />
                  {goal.progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition-colors group-hover:bg-white">
                <span className="font-medium text-muted-foreground">
                  Vencimento
                </span>
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <CalendarIcon className="h-3 w-3 text-slate-400" />
                  {goal.endDate
                    ? format(goal.endDate, "dd/MM/yy", { locale: ptBR })
                    : "Recorrente"}
                </span>
              </div>
            </div>

            {isProductGoal && goal.product && (
              <div className="flex w-fit items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[9px] font-bold text-slate-500 transition-colors group-hover:border-primary/10 group-hover:bg-primary/5 group-hover:text-primary">
                <PackageIcon className="h-3 w-3" />
                PRODUTO: {goal.product.name}
              </div>
            )}
          </div>
        </CardContent>

        <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden bg-slate-50">
          <div
            className={`h-full opacity-50 transition-all duration-700 ${progressColor}`}
            style={{ width: `${goal.progressPercentage}%` }}
          />
        </div>
      </Card>

      {/* Dialogs */}
      <Dialog open={upsertDialogOpen} onOpenChange={setUpsertDialogOpen}>
        <UpsertGoalDialogContent
          goal={goal}
          products={products}
          onClose={() => setUpsertDialogOpen(false)}
        />
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DeleteGoalDialogContent
          id={goal.id}
          name={goal.name}
          onClose={() => setDeleteDialogOpen(false)}
        />
      </Dialog>
    </>
  );
};

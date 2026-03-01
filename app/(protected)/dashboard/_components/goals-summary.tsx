import { getGoals } from "@/app/_data-access/goal/get-goals";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { TargetIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/app/_helpers/currency";

export const GoalsSummary = async () => {
  const goals = await getGoals();

  if (goals.length === 0) return null;

  // Mostrar as 3 metas com mais progresso ou que estão ativas
  const displayGoals = goals.slice(0, 3);

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase italic tracking-tighter text-slate-900">
          <TargetIcon className="h-4 w-4 text-primary" />
          Metas em Destaque
        </CardTitle>
        <Link
          href="/goals"
          className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
        >
          Gerenciar Metas <ChevronRightIcon className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {displayGoals.map((goal) => (
          <div
            key={goal.id}
            className="group space-y-3 rounded-2xl border border-slate-100/50 bg-slate-50 p-4 transition-colors hover:bg-slate-100/50"
          >
            <div className="flex flex-col gap-1">
              <span className="truncate text-[10px] font-bold uppercase tracking-tight text-slate-400 transition-colors group-hover:text-primary">
                {goal.name}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black tabular-nums text-slate-900">
                  {goal.progressPercentage.toFixed(0)}%
                </span>
                <span className="text-[10px] font-semibold tabular-nums text-slate-500">
                  {formatCurrency(goal.currentValue)} /{" "}
                  {formatCurrency(Number(goal.targetValue))}
                </span>
              </div>
            </div>
            <Progress
              value={goal.progressPercentage}
              className="h-1.5 bg-slate-200"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

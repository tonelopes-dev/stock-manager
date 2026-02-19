"use client";

import { CheckCircle2, Circle, ArrowRight, PartyPopper, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { cn } from "@/app/_lib/utils";

interface OnboardingChecklistProps {
  stats: {
    hasProducts: boolean;
    hasSales: boolean;
    hasMinStock: boolean;
    onboardingStep: number;
    productCount: number;
    saleCount: number;
  } | null;
}

export const OnboardingChecklistSkeleton = () => (
  <div className="rounded-xl h-48 w-full bg-white border border-slate-200/80 animate-pulse shadow-sm" />
);

export const OnboardingChecklist = ({ stats }: OnboardingChecklistProps) => {
  if (!stats) return null;

  const tasks = [
    {
      id: "product",
      label: "Crie seu primeiro produto",
      description: "Adicione um item para gerenciar estoque.",
      completed: stats.hasProducts,
    },
    {
      id: "sale",
      label: "Registre sua primeira venda",
      description: "Veja o estoque baixar automaticamente.",
      completed: stats.hasSales,
    },
    {
      id: "alert",
      label: "Configure um alerta de estoque",
      description: "Nunca mais perca vendas por falta de item.",
      completed: stats.hasMinStock, 
    },
  ];

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;
  const isComplete = completedCount === tasks.length;

  if (isComplete) {
    return (
      <Card className="border-none shadow-xl bg-gradient-to-br from-primary/10 via-white to-primary/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors" />
        <CardHeader className="pb-2">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/20 rounded-full text-primary animate-bounce">
                    <PartyPopper size={20} />
                </div>
                <CardTitle className="text-lg font-black italic tracking-tighter uppercase text-slate-900">
                    Setup Completo!
                </CardTitle>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-sm font-bold text-slate-600 leading-relaxed">
                Parabéns! Seu estoque já está configurado para <span className="text-primary">rodar no piloto automático</span>. 
            </p>
            <div className="p-4 bg-white/50 rounded-2xl border border-primary/10 backdrop-blur-sm flex items-center gap-3">
                <Sparkles size={18} className="text-primary" />
                <p className="text-[11px] font-bold text-slate-500 uppercase leading-snug">
                    Você agora faz parte do grupo de gestores que <span className="text-slate-900">não perdem tempo</span> com planilhas.
                </p>
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg bg-white overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-50">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg font-black italic tracking-tighter uppercase text-slate-900">
             Configuração Inicial
          </CardTitle>
          <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
            {completedCount} / {tasks.length} concluídos
          </span>
        </div>
        <div className="space-y-2">
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                {progress < 50 ? "O começo de uma gestão eficiente 🚀" : "Quase lá! Você está indo muito bem 🔥"}
            </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "p-4 flex items-start gap-4 transition-colors",
                task.completed ? "bg-slate-50/50" : "hover:bg-slate-50/30"
              )}
            >
              <div className={cn(
                "mt-0.5 rounded-full p-1",
                task.completed ? "text-primary bg-primary/10" : "text-slate-200"
              )}>
                {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </div>
              <div className="flex-1 space-y-0.5">
                <p className={cn(
                  "text-sm font-bold leading-none",
                  task.completed ? "text-slate-400 line-through" : "text-slate-900"
                )}>
                  {task.label}
                </p>
                <p className="text-[11px] font-medium text-slate-400">
                  {task.description}
                </p>
              </div>
              {!task.completed && (
                <ArrowRight size={14} className="text-slate-300 mt-1" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

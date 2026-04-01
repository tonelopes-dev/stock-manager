import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface JourneyKpiGridProps {
  completedToday: number;
  pendingTasks: number;
  delayedTasks: number;
}

export function JourneyKpiGrid({ completedToday, pendingTasks, delayedTasks }: JourneyKpiGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black uppercase italic tracking-tighter text-muted-foreground">
            Concluídas Hoje
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black italic tracking-tighter text-foreground">
            {completedToday}
          </div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">
            Tarefas finalizadas pela Mica
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black uppercase italic tracking-tighter text-muted-foreground">
            Total Pendentes
          </CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black italic tracking-tighter text-foreground">
            {pendingTasks}
          </div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">
            Itens aguardando ação
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black uppercase italic tracking-tighter text-muted-foreground">
            Eventos Atrasados
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black italic tracking-tighter text-destructive">
            {delayedTasks}
          </div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">
            Passou do prazo (Due Date)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

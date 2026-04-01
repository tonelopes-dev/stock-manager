import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Badge } from "@/app/_components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, MoveRight, User, Calendar } from "lucide-react";
import Link from "next/link";

interface RecentActivityTableProps {
  activities: Array<{
    id: string;
    type: "TASK" | "MOVE";
    title: string;
    description: string;
    customerName: string;
    customerId: string;
    date: Date;
    actorName: string;
  }>;
}

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-xl border-dashed">
        <Calendar className="h-8 w-8 mb-2 opacity-20" />
        <p className="text-sm font-medium">Nenhuma atividade registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-border/40">
            <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Data/Hora
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Atividade
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Quem
            </TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">
               Ação
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id} className="border-border/40 hover:bg-muted/30 transition-colors">
              <TableCell className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                {format(activity.date, "dd/MM 'às' HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {activity.type === "TASK" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <MoveRight className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    <span className="text-sm font-black italic tracking-tighter text-foreground uppercase">
                      {activity.customerName}
                    </span>
                    <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 py-0 border-border/60">
                      {activity.type === "TASK" ? "Tarefa" : "Estágio"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium pr-4">
                    {activity.description}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 opacity-70">
                  <User className="h-3 w-3" />
                  <span className="text-xs font-bold">{activity.actorName}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Link 
                  href={`/customers?id=${activity.customerId}&action=edit`}
                  className="text-[10px] font-black uppercase italic tracking-tighter text-primary hover:underline"
                >
                  Ver Cliente
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

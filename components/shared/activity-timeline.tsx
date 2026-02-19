import { AuditMapper } from "@/app/_services/audit-mapper";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AuditEventType } from "@prisma/client";

interface ActivityTimelineProps {
  logs: any[];
  className?: string;
}

export function ActivityTimeline({ logs, className }: ActivityTimelineProps) {
  if (!logs?.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">Nenhuma atividade recente registrada.</p>
    );
  }

  return (
    <div className={cn("relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent", className)}>
      {logs.map((log) => {
        const mapped = AuditMapper.map(log.type, log.metadata, log.actorName || log.actor?.name || log.actor?.email || "Sistema");
        
        return (
          <div key={log.id} className="relative flex items-start gap-4 group">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm z-10",
              mapped.variant === "critical" ? "text-destructive border-destructive/20" : 
              mapped.variant === "warning" ? "text-yellow-600 border-yellow-200" : 
              "text-primary border-border"
            )}>
              {mapped.icon}
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{mapped.title}</span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-snug">
                {mapped.description}
              </p>
              {log.actor && (
                 <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground/80">
                      por {log.actorName || log.actor.name || log.actor.email}
                    </span>
                 </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

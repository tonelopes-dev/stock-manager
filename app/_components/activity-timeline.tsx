import { AuditService } from "@/app/_services/audit";
import { AuditMapper } from "@/app/_services/audit-mapper";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { AuditEventType } from "@prisma/client";
import Image from "next/image";



interface ActivityTimelineProps {
  companyId: string;
  limit?: number;
  type?: AuditEventType;
  title?: string;
  description?: string;
}

export async function ActivityTimeline({ 
  companyId, 
  limit = 10, 
  type,
  title = "Atividade Recente",
  description = "Últimas ações registradas na empresa."
}: ActivityTimelineProps) {
  const { logs } = await AuditService.getAuditLogs({
    companyId,
    limit,
    type,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent">
            {logs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhuma atividade recente.</p>
            ) : (
              logs.map((log) => {
                const mapped = AuditMapper.map(log.type, log.metadata, log.actorName || log.actor?.name || log.actor?.email || "Unknown");
                
                return (
                  <div key={log.id} className="relative flex items-start gap-3 pl-8">
                    <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-background border shadow-sm z-10">
                      <span className="text-muted-foreground scale-85">
                        {mapped.icon}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium leading-none">
                          {mapped.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {mapped.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 overflow-hidden border border-slate-200 relative">
                          {log.actor?.image ? (
                            <Image 
                              src={log.actor.image} 
                              alt="" 
                              fill
                              className="object-cover" 
                            />
                          ) : (
                            (log.actorName || log.actor?.name || "?")[0]
                          )}
                        </div>

                        <span className="text-[10px] text-muted-foreground">
                          {log.actorName || log.actor?.name || "Usuário Sistema"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>

    </Card>
  );
}

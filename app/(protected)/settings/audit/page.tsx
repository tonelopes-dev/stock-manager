import { AuditService } from "@/app/_services/audit";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, ADMIN_AND_OWNER } from "@/app/_lib/rbac";
import { AuditMapper } from "@/app/_services/audit-mapper";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Badge } from "@/app/_components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { Card, CardContent } from "@/app/_components/ui/card";
import { AuditFilters } from "./_components/audit-filters";
import { db } from "@/app/_lib/prisma";
import { AuditEventType } from "@prisma/client";
import { Button } from "@/app/_components/ui/button";
import Link from "next/link";
import { ChevronRight } from "lucide-react";


interface AuditPageProps {
  searchParams: {
    type?: string;
    actor?: string;
    start?: string;
    end?: string;
    cursor?: string;
  };
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await assertRole(ADMIN_AND_OWNER);
  const companyId = await getCurrentCompanyId();

  const { logs, nextCursor } = await AuditService.getAuditLogs({
    companyId,
    type: searchParams.type as AuditEventType,
    actorId: searchParams.actor,
    startDate: searchParams.start ? new Date(searchParams.start) : undefined,
    endDate: searchParams.end ? new Date(searchParams.end) : undefined,
    cursor: searchParams.cursor,
  });

  const actors = await db.user.findMany({
    where: { userCompanies: { some: { companyId } } },
    select: { id: true, name: true, email: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Registro de Auditoria</h1>
        <p className="text-muted-foreground">
          Histórico detalhado de todas as ações administrativas e mudanças críticas.
        </p>
      </div>

      <AuditFilters actors={actors} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Ator</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead className="w-[150px]">Data</TableHead>
                <TableHead className="w-[100px] text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Nenhum registro encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const mapped = AuditMapper.map(log.type, log.metadata, log.actorName || log.actor?.name || log.actor?.email || "Unknown");
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={log.actor?.image || ""} />
                            <AvatarFallback>{(log.actorName || log.actor?.name || "?")[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{log.actorName || log.actor?.name || "Usuário Sistema"}</span>
                            <span className="text-xs text-muted-foreground">{log.actorEmail || log.actor?.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{mapped.icon}</span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{mapped.title}</span>
                            <span className="text-xs text-muted-foreground">{mapped.description}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={mapped.variant === "critical" ? "destructive" : mapped.variant === "warning" ? "secondary" : "outline"}>
                           {log.severity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          className={!searchParams.cursor ? "pointer-events-none opacity-50" : ""}
        >
          <Link href="/settings/audit">Primeira Página</Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
          className={!nextCursor ? "pointer-events-none opacity-50" : ""}
        >
          <Link href={`?cursor=${nextCursor}&type=${searchParams.type || ""}&actor=${searchParams.actor || ""}`}>
            Próxima <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

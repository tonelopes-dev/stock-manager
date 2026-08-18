import { ActivityTimeline } from "@/app/_components/activity-timeline";
import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { Badge } from "@/app/_components/ui/badge";
import { Card, CardContent } from "@/app/_components/ui/card";
import { getPendingInvitations, getTeamMembers } from "@/app/_data-access/user/get-team-members";
import { auth } from "@/app/_lib/auth";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { PERMISSION_LABELS, PERMISSIONS } from "@/app/_lib/permissions";
import { assertPageCapability } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { ClockIcon, MailIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { MemberCardActions } from "./_components/member-card-actions";
import MemberFormModal from "./_components/member-form-modal";
import { PendingInviteActions } from "./_components/pending-invite-actions";


export default async function TeamPage() {
  // Guard: OWNER bypass | MEMBER/ADMIN precisa de TEAM_SETTINGS_VIEW
  const authData = await assertPageCapability(PERMISSIONS.TEAM_SETTINGS_VIEW);

  const members = await getTeamMembers();
  const pendingInvitations = await getPendingInvitations();
  const requesterRole = authData.role; // Reaproveitamos o role sem nova query
  const session = await auth();
  const requesterId = session?.user?.id;

  const isManagement = requesterRole === UserRole.OWNER || requesterRole === UserRole.ADMIN;

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-background p-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Configurações da Empresa</HeaderSubtitle>
          <HeaderTitle>Gestão de Equipe</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          {isManagement && <MemberFormModal mode="invite" />}
        </HeaderRight>
      </Header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* MEMBERS LIST */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Membros Ativos</h3>
            <div className="grid gap-4">
                {members.map((member) => (
                    <Card key={member.id} className="overflow-hidden border-border transition-hover hover:border-primary/20">
                    <CardContent className="p-0">
                        <div className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden relative">
                            {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.name || ""} className="h-full w-full object-cover" />
                            ) : (
                                <UserIcon size={24} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-foreground truncate">{member.name}</p>
                                <Badge 
                                    variant={member.role === UserRole.OWNER ? "default" : "secondary"}
                                    className="text-[9px] h-4 px-1.5 leading-none font-bold uppercase"
                                >
                                    {member.role === UserRole.OWNER ? "Proprietário" : member.role === UserRole.ADMIN ? "Administrador" : "Colaborador"}
                                </Badge>
                                {member.userId === requesterId && (
                                   <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary text-primary font-black uppercase">Você</Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                            
                            {member.permissions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {member.permissions.map((p) => (
                                        <Badge key={p} variant="outline" className="text-[8px] h-3.5 px-1 bg-muted/30 border-muted-foreground/20 text-muted-foreground font-medium uppercase">
                                            {PERMISSION_LABELS[p as keyof typeof PERMISSION_LABELS] || p}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <MemberCardActions 
                          member={member}
                          requesterRole={requesterRole}
                          isSelf={member.userId === requesterId}
                        />

                        <div className="text-right text-[10px] text-muted-foreground uppercase font-black tracking-widest hidden sm:block">
                            Entrou em<br />
                            {new Date(member.joinedAt).toLocaleDateString("pt-BR")}
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                ))}
            </div>
        </div>

        {/* RELATED INFO */}
        <div className="space-y-4">
            {isManagement && (
              <>
                <h3 className="text-lg font-bold text-foreground">Convites Pendentes</h3>
                {pendingInvitations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center bg-muted/50">
                        <MailIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground font-medium">Nenhum convite pendente</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingInvitations.map((invite) => (
                            <Card key={invite.id} className="border-border bg-orange-500/10">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-foreground">{invite.email}</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] h-3.5 bg-background uppercase font-bold">
                                                {invite.role === UserRole.OWNER ? "Proprietário" : invite.role === UserRole.ADMIN ? "Administrador" : "Colaborador"}
                                            </Badge>
                                            <span className="flex items-center gap-1 text-[10px] text-orange-500 font-bold uppercase tracking-tight">
                                                <ClockIcon size={10} />
                                                Pendente
                                            </span>
                                        </div>
                                    </div>
                                    <PendingInviteActions inviteId={invite.id} token={invite.token} email={invite.email} />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
              </>
            )}

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                    <ShieldCheckIcon size={18} />
                    <span className="text-sm font-bold">Níveis de Acesso</span>
                </div>
                <div className="text-[11px] text-muted-foreground leading-relaxed space-y-2">
                    <p><strong className="text-primary font-black uppercase tracking-tighter">Proprietário:</strong> Controle total. Empresa e Faturamento.</p>
                    <p><strong className="text-foreground font-black uppercase tracking-tighter">Administrador:</strong> Gestão de equipe, produtos e vendas.</p>
                    <p><strong className="text-muted-foreground font-black uppercase tracking-tighter">Colaborador:</strong> Operação de vendas e consulta de estoque.</p>
                </div>
            </div>

            <ActivityTimeline companyId={await getCurrentCompanyId()} title="Atividade da Equipe" />
        </div>

      </div>
    </div>
  );
}

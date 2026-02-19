import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
  HeaderRight,
} from "@/app/_components/header";
import { getTeamMembers, getPendingInvitations } from "@/app/_data-access/user/get-team-members";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { UserIcon, MailIcon, ShieldCheckIcon, ClockIcon } from "lucide-react";
import InviteMemberButton from "./_components/invite-member-button";
import { getCurrentUserRole } from "@/app/_lib/rbac";
import { auth } from "@/app/_lib/auth";
import { UserRole } from "@prisma/client";
import { MemberCardActions } from "./_components/member-card-actions";

export default async function TeamPage() {
  const members = await getTeamMembers();
  const pendingInvitations = await getPendingInvitations();
  const requesterRole = await getCurrentUserRole();
  const session = await auth();
  const requesterId = session?.user?.id;

  if (!requesterRole) return null;

  const isManagement = requesterRole === UserRole.OWNER || requesterRole === UserRole.ADMIN;

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Configurações da Empresa</HeaderSubtitle>
          <HeaderTitle>Gestão de Equipe</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          {isManagement && <InviteMemberButton />}
        </HeaderRight>
      </Header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* MEMBERS LIST */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Membros Ativos</h3>
            <div className="grid gap-4">
                {members.map((member) => (
                    <Card key={member.id} className="overflow-hidden border-slate-100 transition-hover hover:border-primary/20">
                    <CardContent className="p-0">
                        <div className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                            <UserIcon size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 truncate">{member.name}</p>
                                <Badge 
                                    variant={member.role === UserRole.OWNER ? "default" : "secondary"}
                                    className="text-[9px] h-4 px-1 leading-none font-bold"
                                >
                                    {member.role}
                                </Badge>
                                {member.userId === requesterId && (
                                   <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary text-primary font-black uppercase">Você</Badge>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 truncate">{member.email}</p>
                        </div>
                        
                        <MemberCardActions 
                          memberId={member.id}
                          memberRole={member.role as UserRole}
                          requesterRole={requesterRole}
                          isSelf={member.userId === requesterId}
                        />

                        <div className="text-right text-[10px] text-slate-400 uppercase font-black tracking-widest hidden sm:block">
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
                <h3 className="text-lg font-bold text-slate-900">Convites Pendentes</h3>
                {pendingInvitations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                        <MailIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                        <p className="text-xs text-slate-500 font-medium">Nenhum convite pendente</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingInvitations.map((invite) => (
                            <Card key={invite.id} className="border-slate-100 bg-amber-50/10">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-800">{invite.email}</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] h-3.5 bg-white">{invite.role}</Badge>
                                            <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase tracking-tight">
                                                <ClockIcon size={10} />
                                                Pendente
                                            </span>
                                        </div>
                                    </div>
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
                    <span className="text-sm font-bold">Segurança & Roles</span>
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed space-y-2">
                    <p><strong className="text-primary font-black uppercase tracking-tighter">Owner:</strong> Controle total. Empresa e Faturamento.</p>
                    <p><strong className="text-slate-900 font-black uppercase tracking-tighter">Admin:</strong> Gestão de equipe, produtos e vendas.</p>
                    <p><strong className="text-slate-500 font-black uppercase tracking-tighter">Membro:</strong> Operação de vendas e consulta de estoque.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

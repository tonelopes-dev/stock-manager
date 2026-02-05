import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { auth } from "@/app/_lib/auth";
import { getUserRoleInCompany } from "@/app/_lib/rbac";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { ProfileForm } from "./_components/profile-form";
import { SecurityForm } from "./_components/security-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { UserIcon, ShieldCheckIcon, BuildingIcon } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  const companyId = await getCurrentCompanyId();
  const role = await getUserRoleInCompany(companyId);
  
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { name: true, plan: true }
  });

  const user = await db.user.findUnique({
    where: { id: session?.user?.id },
    select: { name: true, email: true, phone: true }
  });

  return (
    <div className="m-8 space-y-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Configurações da Conta</HeaderSubtitle>
          <HeaderTitle>Meu Perfil</HeaderTitle>
        </HeaderLeft>
      </Header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Informações Pessoais */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <UserIcon size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Informações Pessoais</CardTitle>
                  <CardDescription>Mantenha seus dados de contato atualizados.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} />
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <ShieldCheckIcon size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Segurança</CardTitle>
                  <CardDescription>Gerencie sua senha e proteção da conta.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SecurityForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Status da Conta */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/50">
            <CardHeader>
               <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <BuildingIcon size={20} />
                </div>
                <CardTitle className="text-xl font-black">Contexto Corporativo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa Ativa</p>
                <p className="font-black text-slate-900">{company?.name}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seu Papel</p>
                <div className="flex">
                   <Badge variant="secondary" className="font-black px-3 py-1 bg-white border-slate-200 text-primary">
                    {role === "OWNER" ? "Proprietário" : role === "ADMIN" ? "Administrador" : "Membro"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plano Atual</p>
                <Badge className="font-black px-3 py-1 bg-primary text-white">
                  {company?.plan}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-xl border border-blue-100 bg-blue-50/50">
             <h4 className="text-sm font-black text-blue-900 mb-2">Dica de Segurança</h4>
             <p className="text-xs text-blue-700 leading-relaxed">
                Nunca compartilhe sua senha temporária. Ao convidar membros, peça que eles alterem a senha no primeiro acesso.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

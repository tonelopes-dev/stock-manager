import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { CompanyForm } from "./_components/company-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Building2Icon, CreditCardIcon, AlertTriangleIcon } from "lucide-react";


export default async function CompanySettingsPage() {
  const companyId = await getCurrentCompanyId();
  
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      allowNegativeStock: true,
      stripeCustomerId: true,
      subscriptionStatus: true,
    },
  });

  if (!company) return null;

  return (
    <div className="m-8 space-y-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Configurações Globais</HeaderSubtitle>
          <HeaderTitle>Dados da Empresa</HeaderTitle>
        </HeaderLeft>
      </Header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Dados Gerais */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Building2Icon size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Informações do Negócio</CardTitle>
                  <CardDescription>Gerencie a identidade e regras de estoque da sua empresa.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CompanyForm initialData={{ 
                name: company.name, 
                allowNegativeStock: company.allowNegativeStock 
              }} />
            </CardContent>
          </Card>

          {/* Faturamento e Stripe */}
          <Card className="border-slate-200 shadow-sm">
             <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                  <CreditCardIcon size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Faturamento & Gateway</CardTitle>
                  <CardDescription>Dados técnicos de integração com o Stripe.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-slate-50/50">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Stripe Customer ID</p>
                     <p className="text-sm font-mono text-slate-600 truncate">{company.stripeCustomerId || "Não vinculado"}</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50/50">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status Assinatura</p>
                     <Badge variant="outline" className="font-bold uppercase bg-white">{company.subscriptionStatus || "FREE"}</Badge>
                  </div>
               </div>
               <p className="text-xs text-slate-500">
                  Para gerenciar métodos de pagamento e faturas, utilize a aba <span className="font-bold text-primary italic">Assinatura</span> no menu lateral.
               </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           {/* Zona de Perigo */}
           <Card className="border-red-100 bg-red-50/30 overflow-hidden shadow-sm">
             <CardHeader className="border-b border-red-100 bg-red-50/50">
               <div className="flex items-center gap-3 text-red-700">
                 <AlertTriangleIcon size={20} />
                 <CardTitle className="text-lg font-black">Zona de Perigo</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="pt-6 space-y-4">
                <p className="text-xs text-red-600 leading-relaxed font-medium">
                  A exclusão da empresa é <strong className="uppercase">irreversível</strong>. Todos os dados de produtos, vendas e equipe serão apagados permanentemente.
                </p>
                <Button variant="destructive" className="w-full font-black text-xs h-11" disabled>
                   Excluir Empresa (Bloqueado)
                </Button>
                <p className="text-[10px] text-center text-red-400 italic">
                  Contate o suporte para exclusão total da conta.
                </p>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

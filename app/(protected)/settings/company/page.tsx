import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { CompanyForm } from "./_components/company-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Building2Icon, CreditCardIcon } from "lucide-react";

import { DangerZone } from "./_components/danger-zone";
import { UserRole } from "@prisma/client";
import { ActivityTimeline } from "@/app/_components/activity-timeline";

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

  // Fetch Admins for ownership transfer
  const admins = await db.userCompany.findMany({
    where: {
      companyId,
      role: UserRole.ADMIN,
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const adminList = admins.map((a) => ({
    id: a.user.id,
    name: a.user.name,
    email: a.user.email,
  }));

  return (
    <div className="m-8 space-y-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Configurações Globais</HeaderSubtitle>
          <HeaderTitle>Dados da Empresa</HeaderTitle>
        </HeaderLeft>
      </Header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Dados Gerais */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Building2Icon size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">
                    Informações do Negócio
                  </CardTitle>
                  <CardDescription>
                    Gerencie a identidade e regras de estoque da sua empresa.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CompanyForm
                initialData={{
                  name: company.name,
                  allowNegativeStock: company.allowNegativeStock,
                }}
              />
            </CardContent>
          </Card>

          {/* Faturamento e Stripe */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                  <CreditCardIcon size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">
                    Faturamento & Gateway
                  </CardTitle>
                  <CardDescription>
                    Dados técnicos de integração com o Stripe.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border bg-slate-50/50 p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    ID do Cliente Stripe
                  </p>
                  <p className="truncate font-mono text-sm text-slate-600">
                    {company.stripeCustomerId || "Não vinculado"}
                  </p>
                </div>
                <div className="rounded-xl border bg-slate-50/50 p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status da Assinatura
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-white font-bold uppercase"
                  >
                    {company.subscriptionStatus === "TRIALING"
                      ? "Em Teste"
                      : company.subscriptionStatus === "ACTIVE"
                        ? "Ativa"
                        : company.subscriptionStatus === "PAST_DUE"
                          ? "Pagamento Pendente"
                          : company.subscriptionStatus === "CANCELED"
                            ? "Cancelada"
                            : company.subscriptionStatus === "INCOMPLETE"
                              ? "Incompleta"
                              : "Gratuito"}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Para gerenciar métodos de pagamento e faturas, utilize a aba{" "}
                <span className="font-bold italic text-primary">
                  Assinatura
                </span>{" "}
                no menu lateral.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <ActivityTimeline
            companyId={companyId}
            title="Histórico da Empresa"
          />
          <DangerZone companyName={company.name} admins={adminList} />
        </div>
      </div>
    </div>
  );
}

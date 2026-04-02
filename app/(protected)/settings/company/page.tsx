import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { CompanyForm } from "./_components/company-form";
import { OperationalCostsSection } from "./_components/operational-costs-section";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Building2Icon, CreditCardIcon } from "lucide-react";
import Link from "next/link";

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
      subscriptionStatus: true,
      estimatedMonthlyVolume: true,
      enableOverheadInjection: true,
      fixedExpenses: true,
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
          <Card className="border-border shadow-sm">
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
                  estimatedMonthlyVolume: company.estimatedMonthlyVolume,
                  enableOverheadInjection: company.enableOverheadInjection,
                }}
              />
            </CardContent>
          </Card>

          {/* Custos Operacionais Globais */}
          <OperationalCostsSection 
            fixedExpenses={company.fixedExpenses.map(fe => ({
              ...fe,
              value: Number(fe.value)
            }))}
            estimatedMonthlyVolume={company.estimatedMonthlyVolume}
          />

          {/* Faturamento */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <CreditCardIcon size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">
                    Assinatura e Faturamento
                  </CardTitle>
                  <CardDescription>
                    Status atual da sua conta no Kipo.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/50 p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Provedor de Pagamento
                  </p>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Mercado Pago
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/50 p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Status da Assinatura
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-background font-bold uppercase transition-all"
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
              <p className="text-xs text-muted-foreground">
                Para gerenciar planos, pagamentos e faturas, utilize a aba{" "}
                <Link
                  href="/plans"
                  className="font-bold italic text-primary hover:underline"
                >
                  Assinatura
                </Link>{" "}
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

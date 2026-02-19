import Header, {
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { getCompanyPlan } from "@/app/_data-access/company/get-company-plan";
import PlanActions from "./_components/plan-actions";
import { SubscriptionStatus } from "./_components/subscription-status";
import { getSubscriptionUIState } from "@/app/_lib/subscription-utils";
import { CheckIcon, CalendarIcon, ShieldCheckIcon } from "lucide-react";
import { Badge } from "@/app/_components/ui/badge";

const PlansPage = async () => {
  const { subscriptionStatus, stripeCurrentPeriodEnd } = await getCompanyPlan();
  const uiState = getSubscriptionUIState(subscriptionStatus, stripeCurrentPeriodEnd);


  const features = [
    "Produtos ilimitados (Sem restrições)",
    "Usuários ilimitados (Sem restrições)",
    "Dashboard avançado com métricas em tempo real",
    "Gestão de estoque inteligente e produção",
    "Suporte prioritário via WhatsApp/Email",
    "Relatórios e auditoria completa",
  ];

  const severityColors = {
    info: "text-blue-600",
    warning: "text-amber-600",
    danger: "text-red-600",
    success: "text-green-600",
    neutral: "text-gray-600",
  };

  return (
    <div className="flex flex-col space-y-8 p-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gerencie seu plano e faturamento</HeaderSubtitle>
          <div className="flex items-center gap-4">
            <HeaderTitle>Assinatura</HeaderTitle>
            <SubscriptionStatus subscriptionStatus={subscriptionStatus} />
          </div>
        </HeaderLeft>

      </Header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* CARD PRINCIPAL DE STATUS */}
        <Card className="flex-1 shadow-md border-2 border-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">{uiState.statusLabel}</CardTitle>
                <CardDescription className="mt-1">{uiState.description}</CardDescription>
              </div>
              <Badge variant={uiState.severity === "success" ? "default" : "secondary"}>
                {subscriptionStatus || "FREE"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg bg-gray-50 p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 bg-white shadow-sm ${severityColors[uiState.severity]}`}>
                   <CalendarIcon size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Período atual</p>
                  <p className="text-sm font-semibold">
                    {stripeCurrentPeriodEnd 
                      ? `Até ${new Date(stripeCurrentPeriodEnd).toLocaleDateString()}` 
                      : "Sem período ativo"}
                  </p>
                </div>
              </div>

              {subscriptionStatus === "ACTIVE" && (
                 <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-white shadow-sm text-green-600">
                        <ShieldCheckIcon size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Benefícios</p>
                        <p className="text-sm font-semibold text-green-700">Acesso Pro Desbloqueado</p>
                    </div>
                 </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-700 uppercase tracking-tight">O que está incluído:</p>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 py-6 bg-gray-50/50">
             <PlanActions 
                planName="Pro" 
                isPro={subscriptionStatus === "ACTIVE"} 
                isCurrent={subscriptionStatus === "ACTIVE"} 
                actionLabel={uiState.primaryCTA.label}
              />
              {uiState.secondaryCTA && (
                <p className="text-[10px] text-center text-gray-400 font-medium">
                   Deseja cancelar? Você pode gerenciar sua assinatura no <span className="font-bold underline cursor-pointer">Portal do Cliente</span>.
                </p>
              )}
          </CardFooter>
        </Card>

        {/* INFO ADICIONAL (Opcional) */}
        <div className="w-full lg:w-80 space-y-4">
           <div className="rounded-xl border bg-white p-6 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-2">Dúvidas sobre faturamento?</h3>
             <p className="text-sm text-gray-500 mb-4">
               Nosso sistema utiliza o Stripe para pagamentos seguros. Você pode atualizar seu cartão ou baixar faturas a qualquer momento.
             </p>
             <button className="text-sm font-bold text-primary hover:underline">
               Falar com suporte
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;


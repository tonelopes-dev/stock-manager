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
  const { subscriptionStatus, expiresAt, isBoletoPending } =
    await getCompanyPlan();
  const uiState = getSubscriptionUIState(subscriptionStatus, expiresAt);

  const features = [
    "Produtos ilimitados (Sem restrições)",
    "Usuários ilimitados (Sem restrições)",
    "Dashboard avançado com métricas em tempo real",
    "Gestão de estoque inteligente e produção",
    "Suporte prioritário via WhatsApp/Email",
    "Relatórios e auditoria completa",
  ];

  const severityColors = {
    info: "text-primary",
    warning: "text-orange-500",
    danger: "text-destructive",
    success: "text-green-600",
    neutral: "text-muted-foreground",
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
        <Card className="flex-1 border-2 border-primary/10 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">
                  {uiState.statusLabel}
                </CardTitle>
                <CardDescription className="mt-1">
                  {uiState.description}
                </CardDescription>
              </div>
              <Badge
                variant={
                  uiState.severity === "success" ? "default" : "secondary"
                }
              >
                {subscriptionStatus || "FREE"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full bg-background p-2 shadow-sm ${severityColors[uiState.severity]}`}
                >
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Período atual
                  </p>
                  <p className="text-sm font-semibold">
                    {expiresAt
                      ? `Até ${new Date(expiresAt).toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}`
                      : "Sem período ativo"}
                  </p>
                </div>
              </div>

              {subscriptionStatus === "ACTIVE" && (
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-background p-2 text-green-600 shadow-sm">
                    <ShieldCheckIcon size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      Benefícios
                    </p>
                    <p className="text-sm font-semibold text-green-700">
                      Acesso Pro Desbloqueado
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-tight text-foreground">
                O que está incluído:
              </p>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 bg-muted/50 py-6">
            <PlanActions
              planName="Pro"
              isPro={subscriptionStatus === "ACTIVE"}
              isCurrent={subscriptionStatus === "ACTIVE"}
              actionLabel={uiState.primaryCTA.label}
              allowRenewal={uiState.allowRenewal}
              externalLink={isBoletoPending ? null : null} // Placeholder for any MP specific pending links if needed
              externalLabel="Visualizar Pagamento"
            />
          </CardFooter>
        </Card>

        {/* INFO ADICIONAL (Opcional) */}
        <div className="w-full space-y-4 lg:w-80">
          <div className="rounded-xl border bg-background p-6 shadow-sm">
            <h3 className="mb-2 font-bold text-foreground">
              Dúvidas sobre faturamento?
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Nosso sistema utiliza o Mercado Pago para pagamentos seguros. Você
              pode pagar via Pix, Boleto ou Cartão de Crédito.
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

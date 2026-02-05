import { CheckIcon } from "lucide-react";
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
import { Badge } from "@/app/_components/ui/badge";
import { getCompanyPlan } from "@/app/_data-access/company/get-company-plan";
import PlanActions from "./_components/plan-actions";
import { SubscriptionStatus } from "./_components/subscription-status";

const PlansPage = async () => {
  const { plan } = (await getCompanyPlan()) as any;

  const plans = [
    {
      name: "Free",
      price: "R$ 0",
      description: "Ideal para começar seu negócio.",
      features: [
        "Até 20 produtos ativos",
        "1 usuário",
        "Dashboard básico",
        "Suporte via e-mail",
      ],
      isCurrent: plan === "FREE",
      actionLabel: "Plano Atual",
      disabled: true,
    },
    {
      name: "Pro",
      price: "R$ 49",
      period: "/mês",
      description: "Para empresas em crescimento que precisam de mais.",
      features: [
        "Produtos ilimitados (Beta)",
        "Usuários ilimitados (Beta)",
        "Dashboard avançado",
        "Suporte prioritário",
        "Gestão de estoque inteligente",
      ],
      isCurrent: plan === "PRO",
      actionLabel: plan === "PRO" ? "Gerenciar Assinatura" : "Upgrade para Pro",
      highlight: true,
    },
  ];

  return (
    <div className="flex flex-col space-y-8 p-8">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gerencie sua assinatura e limites</HeaderSubtitle>
          <div className="flex items-center gap-4">
            <HeaderTitle>Planos</HeaderTitle>
            <SubscriptionStatus initialPlan={plan} />
          </div>
        </HeaderLeft>
      </Header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:max-w-4xl">
        {plans.map((p) => (
          <Card
            key={p.name}
            className={`flex flex-col transition-all hover:shadow-lg ${
              p.highlight ? "border-primary ring-1 ring-primary" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">{p.name}</CardTitle>
                {p.highlight && (
                  <Badge variant="default" className="bg-primary">
                    Recomendado
                  </Badge>
                )}
                {p.isCurrent && !p.highlight && (
                  <Badge variant="secondary">Atual</Badge>
                )}
              </div>
              <CardDescription>{p.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                {p.period && (
                  <span className="text-muted-foreground">{p.period}</span>
                )}
              </div>

              <ul className="space-y-3">
                {p.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <PlanActions 
                planName={p.name} 
                isPro={plan === "PRO"} 
                isCurrent={p.isCurrent} 
                actionLabel={p.actionLabel}
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlansPage;

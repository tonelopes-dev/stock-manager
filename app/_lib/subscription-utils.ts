import { SubscriptionStatus } from "@prisma/client";

export interface SubscriptionUIState {
  statusLabel: string;
  description: string;
  primaryCTA: {
    label: string;
    href: string;
    variant: "default" | "outline" | "destructive";
  };
  secondaryCTA?: {
    label: string;
    href: string;
  };
  severity: "info" | "warning" | "danger" | "success" | "neutral";
  daysRemaining?: number;
}

export function getSubscriptionUIState(
  status: SubscriptionStatus | null,
  periodEnd: Date | null
): SubscriptionUIState {
  const now = new Date();
  const end = periodEnd ? new Date(periodEnd) : null;
  const diffMs = end ? end.getTime() - now.getTime() : 0;
  const daysRemaining = end ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;

  // 1. TRIALING
  if (status === SubscriptionStatus.TRIALING || (!status && daysRemaining > 0)) {
    return {
      statusLabel: "Teste Gratuito",
      description: `${daysRemaining} ${daysRemaining === 1 ? "dia restante" : "dias restantes"}`,
      severity: daysRemaining <= 2 ? "danger" : daysRemaining <= 7 ? "warning" : "info",
      primaryCTA: {
        label: "Ativar plano agora",
        href: "/plans",
        variant: "default",
      },
      daysRemaining,
    };
  }

  // 2. ACTIVE
  if (status === SubscriptionStatus.ACTIVE) {
    return {
      statusLabel: "Plano Pro",
      description: "Assinatura ativa",
      severity: "success",
      primaryCTA: {
        label: "Gerenciar assinatura",
        href: "/plans", // The plans page will handle the portal redirection or display status
        variant: "outline",
      },
      secondaryCTA: {
        label: "Ver faturamento",
        href: "/plans",
      }
    };
  }

  // 3. INACTIVE (PAST_DUE, CANCELED, INCOMPLETE)
  if (status && ["PAST_DUE", "CANCELED", "INCOMPLETE"].includes(status)) {
    return {
      statusLabel: "Assinatura Inativa",
      description: "Regularize para continuar",
      severity: "danger",
      primaryCTA: {
        label: "Regularizar",
        href: "/billing-required",
        variant: "destructive",
      },
    };
  }

  // 4. NULL / LEGACY / NEW USER (No trial started yet or expired)
  return {
    statusLabel: "Sem Assinatura",
    description: "Inicie seu teste grátis",
    severity: "neutral",
    primaryCTA: {
      label: "Explorar Planos",
      href: "/plans",
      variant: "default",
    },
  };
}

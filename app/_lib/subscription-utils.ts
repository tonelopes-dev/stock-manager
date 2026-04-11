import { SubscriptionStatus as DBStatus } from "@prisma/client";
import { getSubscriptionStatus } from "@/lib/subscription";

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
  allowRenewal: boolean;
}

export function getSubscriptionUIState(
  status: DBStatus | null,
  periodEnd: Date | null
): SubscriptionUIState {
  const subStatus = getSubscriptionStatus(periodEnd);
  const daysRemaining = subStatus.daysRemaining;
  const level = subStatus.level;

  // 1. TRIALING
  if (status === DBStatus.TRIALING || (!status && daysRemaining > 0)) {
    return {
      statusLabel: "Teste Gratuito",
      description: `${daysRemaining} ${daysRemaining === 1 ? "dia restante" : "dias restantes"}`,
      severity: level === "expired" ? "danger" : level === "urgent" ? "danger" : level === "warning" ? "warning" : "info",
      allowRenewal: true,
      primaryCTA: {
        label: "Ativar plano agora",
        href: "/plans",
        variant: "default",
      },
      daysRemaining,
    };
  }

  // 2. ACTIVE
  if (status === DBStatus.ACTIVE) {
    const isExpiringSoon = level === "warning" || level === "urgent" || level === "expired";
    
    return {
      statusLabel: "Plano Pro",
      description: isExpiringSoon 
        ? `Expira em ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}`
        : "Assinatura ativa",
      severity: level === "urgent" || level === "expired" ? "danger" : level === "warning" ? "warning" : "success",
      allowRenewal: isExpiringSoon,
      primaryCTA: {
        label: isExpiringSoon ? "Renovar Assinatura" : "Plano Ativo",
        href: "/plans",
        variant: isExpiringSoon ? "default" : "outline",
      },
      daysRemaining,
    };
  }

  // 3. INACTIVE (PAST_DUE, CANCELED, INCOMPLETE)
  if (status && ["PAST_DUE", "CANCELED", "INCOMPLETE"].includes(status)) {
    return {
      statusLabel: "Assinatura Inativa",
      description: "Regularize para continuar",
      severity: "danger",
      allowRenewal: true,
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
    allowRenewal: true,
    primaryCTA: {
      label: "Explorar Planos",
      href: "/plans",
      variant: "default",
    },
  };
}

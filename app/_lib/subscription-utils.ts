import { SubscriptionStatus as DBStatus } from "@prisma/client";
import { getSubscriptionStatus } from "@/lib/subscription";
import { addMonths, format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  renewalDatePreview?: string | null;
}

export function getSubscriptionUIState(
  status: DBStatus | null,
  periodEnd: Date | null
): SubscriptionUIState {
  const subStatus = getSubscriptionStatus(periodEnd);
  const daysRemaining = subStatus.daysRemaining;
  const level = subStatus.level;

  const now = new Date();
  const baseDate = (periodEnd && isAfter(periodEnd, now)) ? periodEnd : now;
  const nextPeriodEnd = addMonths(baseDate, 1);
  const renewalDatePreview = format(nextPeriodEnd, "dd/MM/yyyy", { locale: ptBR });

  // 1. TRIALING
  if (status === DBStatus.TRIALING || (!status && daysRemaining > 0)) {
    return {
      statusLabel: "Teste Gratuito",
      description: `${daysRemaining} ${daysRemaining === 1 ? "dia restante" : "dias restantes"}`,
      severity: level === "expired" ? "danger" : level === "urgent" ? "danger" : level === "warning" ? "warning" : "info",
      allowRenewal: true,
      renewalDatePreview,
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
    const isExpired = level === "expired";
    const isExpiringSoon = level === "warning" || level === "urgent" || isExpired;
    
    return {
      statusLabel: isExpired ? "Assinatura Expirada" : "Plano Pro",
      description: isExpired
        ? "Renove para continuar usando o Kipo"
        : isExpiringSoon 
          ? `Expira em ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}`
          : "Assinatura ativa",
      severity: level === "urgent" || isExpired ? "danger" : level === "warning" ? "warning" : "success",
      allowRenewal: true,
      renewalDatePreview,
      primaryCTA: {
        label: isExpired ? "Regularizar Agora" : isExpiringSoon ? "Renovar Assinatura" : "Adicionar +1 Mês",
        href: "/plans",
        variant: isExpiringSoon || isExpired ? "default" : "outline",
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
      renewalDatePreview,
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
    renewalDatePreview,
    primaryCTA: {
      label: "Explorar Planos",
      href: "/plans",
      variant: "default",
    },
  };
}

export type SubscriptionLevel = 'safe' | 'warning' | 'urgent' | 'expired';

export interface SubscriptionStatus {
  daysRemaining: number;
  level: SubscriptionLevel;
}

/**
 * Calcula o status da assinatura com base na data de expiração.
 * 
 * Lógica:
 * - 'safe': dias > 5
 * - 'warning': dias <= 5
 * - 'urgent': dias <= 2
 * - 'expired': dias <= 0
 */
export function getSubscriptionStatus(expiresAt: Date | null): SubscriptionStatus {
  if (!expiresAt) {
    return { daysRemaining: 0, level: 'expired' };
  }

  const now = new Date();
  
  // Garantir que trabalhamos apenas com a data (sem horas) para evitar inconsistências
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiration = new Date(expiresAt.getFullYear(), expiresAt.getMonth(), expiresAt.getDate());
  
  const diffTime = expiration.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return { daysRemaining, level: 'expired' };
  }

  if (daysRemaining <= 2) {
    return { daysRemaining, level: 'urgent' };
  }

  if (daysRemaining <= 5) {
    return { daysRemaining, level: 'warning' };
  }

  return { daysRemaining, level: 'safe' };
}

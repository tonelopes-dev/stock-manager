import { db } from "./prisma";
import { BusinessError } from "./errors";

/**
 * Verifies that a company has an active subscription (TRIALING or ACTIVE).
 *
 * Strategy:
 * - If subscriptionStatus is null → legacy company (pre-Stripe), allow access.
 * - If subscriptionStatus is TRIALING or ACTIVE → allow access.
 * - Otherwise → throw SubscriptionRequiredError.
 *
 * This allows a safe transition period where existing companies continue
 * working until they are migrated to the new subscription flow.
 */
export async function requireActiveSubscription(companyId: string): Promise<void> {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { 
      subscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  // Legacy company (pre-Stripe) — allow access during transition period
  if (company.subscriptionStatus === null) {
    return;
  }

  const allowedStatuses = ["TRIALING", "ACTIVE"] as const;

  // 1. Check status
  if (!allowedStatuses.includes(company.subscriptionStatus as (typeof allowedStatuses)[number])) {
    throw new BusinessError(
      "Sua assinatura expirou ou está inativa. Acesse a página de Planos para reativar."
    );
  }

  // 2. Check period end (Trial/Subscription expiration)
  const now = new Date();
  if (company.stripeCurrentPeriodEnd && company.stripeCurrentPeriodEnd < now) {
    throw new BusinessError(
      "Seu período de acesso expirou. Acesse a página de Planos para assinar e continuar usando o sistema."
    );
  }
}

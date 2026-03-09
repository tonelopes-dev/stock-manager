import { db } from "./prisma";
import { BusinessError } from "./errors";
import { redirect } from "next/navigation";

/**
 * Verifies that a company has an active subscription based on the expiration date.
 * 
 * Strategy:
 * - If expiresAt is null → block (manual subscription required).
 * - If expiresAt < current date → block.
 * - Otherwise → allow access.
 */
export async function requireActiveSubscription(companyId: string): Promise<void> {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { 
      expiresAt: true,
    },
  });

  if (!company) {
    redirect("/login?reason=session_expired");
  }

  const now = new Date();
  // Timezone consistent comparison: set hours to 0 to compare full days if needed, 
  // or use full precision for exact second blocking.
  // Here we use exact time for strict blocking as requested.
  if (!company.expiresAt || company.expiresAt < now) {
    throw new BusinessError(
      "Seu período de acesso expirou. Acesse a página de Planos para assinar e continuar usando o sistema."
    );
  }
}


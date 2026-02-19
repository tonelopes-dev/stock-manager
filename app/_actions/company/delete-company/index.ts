"use server";

import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, OWNER_ONLY } from "@/app/_lib/rbac";
import { AuditEventType, AuditSeverity } from "@prisma/client";
import { redirect } from "next/navigation";
import { AuditService } from "@/app/_services/audit";
import { stripe } from "@/app/_lib/stripe";
import { revalidatePath } from "next/cache";

const deleteCompanySchema = z.object({
  confirmationString: z.string(),
});

/**
 * SOFT DELETE COMPANY
 * 1. Sets deletedAt
 * 2. Marks Stripe subscription to cancel at period end
 * 3. Logs Audit Event
 */
export const softDeleteCompany = actionClient
  .schema(deleteCompanySchema)
  .action(async ({ parsedInput: { confirmationString } }) => {
    const { userId } = await assertRole(OWNER_ONLY);
    const companyId = await getCurrentCompanyId();

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { name: true, stripeSubscriptionId: true },
    });

    if (!company) throw new Error("Empresa não encontrada.");
    if (confirmationString !== company.name) {
      throw new Error("O nome da empresa não confere.");
    }

    try {
      await db.$transaction(async (tx) => {
        // 1. Soft Delete
        await tx.company.update({
          where: { id: companyId },
          data: { deletedAt: new Date() },
        });

        // 2. Stripe: Cancel at period end
        if (company.stripeSubscriptionId) {
          await stripe.subscriptions.update(company.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });
        }

        // 3. Audit
        await AuditService.logWithTransaction(tx, {
          type: AuditEventType.COMPANY_SOFT_DELETED,
          severity: AuditSeverity.CRITICAL,
          companyId,
          entityType: "COMPANY",
          entityId: companyId,
          metadata: {
            companyName: company.name,
            action: "soft_delete",
          },
        });
      });

      // Redirect to a specific "Goodbye/Restore" page or logout
      // Since it's soft deleted, middleware will now handle subsequent requests.
      revalidatePath("/", "layout");
      redirect("/login?reason=company_deactivated");
    } catch (error: any) {
      console.error("Soft Delete Error:", error);
      throw new Error(error.message || "Erro ao desativar empresa.");
    }
  });

const restoreCompanySchema = z.object({});

export const restoreCompany = actionClient
  .schema(restoreCompanySchema)
  .action(async () => {
    const { userId } = await assertRole(OWNER_ONLY);
    const companyId = await getCurrentCompanyId();

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { name: true, stripeSubscriptionId: true },
    });

    if (!company) throw new Error("Empresa não encontrada.");

    try {
      await db.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: companyId },
          data: { deletedAt: null },
        });

        // Stripe: Remove cancel_at_period_end
        if (company.stripeSubscriptionId) {
          await stripe.subscriptions.update(company.stripeSubscriptionId, {
            cancel_at_period_end: false,
          });
        }

        await AuditService.logWithTransaction(tx, {
          type: AuditEventType.COMPANY_RESTORED,
          severity: AuditSeverity.CRITICAL,
          companyId,
          entityType: "COMPANY",
          entityId: companyId,
          metadata: {
            companyName: company.name,
            action: "restore",
          },
        });
      });

      revalidatePath("/", "layout");
      return { success: true };
    } catch (error: any) {
      console.error("Restore Error:", error);
      throw new Error(error.message || "Erro ao restaurar empresa.");
    }
  });

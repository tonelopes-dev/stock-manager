"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { upsertMercadoPagoSchema } from "./schema";
import { db } from "@/app/_lib/prisma";
import { assertRole } from "@/app/_lib/rbac";
import { EncryptedCredentials } from "@/app/_data-access/integration/types";
import { revalidatePath } from "next/cache";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { IntegrationProvider } from "@prisma/client";

// Helper function to disable other payment gateways
async function disableOtherPaymentGateways(companyId: string, currentProvider: IntegrationProvider) {
  const paymentProviders = [IntegrationProvider.MERCADOPAGO];
  const otherProviders = paymentProviders.filter(p => p !== currentProvider);

  await db.companyIntegration.updateMany({
    where: {
      companyId,
      provider: { in: otherProviders },
      isEnabled: true,
    },
    data: {
      isEnabled: false,
    },
  });
}


export const upsertMercadoPagoIntegration = actionClient
  .schema(upsertMercadoPagoSchema)
  .action(async ({ parsedInput: { provider, companyId, accessToken, publicKey, isEnabled } }) => {
    await assertRole(["OWNER", "ADMIN"]);
    
    const currentCompanyId = await getCurrentCompanyId();
    if (currentCompanyId !== companyId) {
      throw new Error("Unauthorized tenant access");
    }

    // Convert to the exact enum value if parsedInput comes as string literal
    const providerEnum = provider as IntegrationProvider;

    const credentials: EncryptedCredentials = {
      accessToken,
      publicKey,
    };

    await db.$transaction(async (tx) => {
      await tx.companyIntegration.upsert({
        where: {
          companyId_provider: { companyId, provider: providerEnum },
        },
        update: {
          isEnabled,
          credentials: credentials as any,
        },
        create: {
          companyId,
          provider: providerEnum,
          isEnabled,
          credentials: credentials as any,
        },
      });

      if (isEnabled) {
        await disableOtherPaymentGateways(companyId, providerEnum);
      }
    });

    revalidatePath("/integracoes");
    return { success: true };
  });

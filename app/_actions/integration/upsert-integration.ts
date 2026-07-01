"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { upsertInfinityPaySchema } from "./schema";
import { db } from "@/app/_lib/prisma";
import { encrypt } from "@/app/_lib/encryption";
import { assertRole, OWNER_ONLY } from "@/app/_lib/rbac";
import { EncryptedCredentials } from "@/app/_data-access/integration/types";
import { revalidatePath } from "next/cache";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const upsertInfinityPayIntegration = actionClient
  .schema(upsertInfinityPaySchema)
  .action(async ({ parsedInput: { provider, companyId, merchantId, isEnabled } }) => {
    // 1. Autorização
    // Apenas OWNER ou ADMIN podem alterar configurações (OWNER_ONLY e ADMIN_ONLY do RBAC ou custom list)
    await assertRole(["OWNER", "ADMIN"]);
    
    const currentCompanyId = await getCurrentCompanyId();
    // Assegura isolamento (multi-tenancy) verificando com o ctx
    if (currentCompanyId !== companyId) {
      throw new Error("Unauthorized tenant access");
    }

    // O merchantId neste contexto da InfinitePay é a "InfiniteTag" (handle)
    const credentials: EncryptedCredentials = {
      merchantId,
    };

    // 3. Upsert no banco
    await db.companyIntegration.upsert({
      where: {
        companyId_provider: {
          companyId,
          provider,
        },
      },
      update: {
        isEnabled,
        credentials: credentials as any,
      },
      create: {
        companyId,
        provider,
        isEnabled,
        credentials: credentials as any,
      },
    });

    // 4. Invalida cache da rota
    revalidatePath("/integracoes");
    
    return { success: true };
  });

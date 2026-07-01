import "server-only";
import { db } from "@/app/_lib/prisma";
import { IntegrationProvider } from "@prisma/client";
import { EncryptedCredentials } from "./types";

/**
 * Busca uma integração específica, retornando inclusive as credenciais CRIPTOGRAFADAS.
 * SÓ DEVE SER USADO POR SERVER ACTIONS E WEBHOOKS. Nunca envie este retorno para Clients.
 */
export async function getIntegrationRawData(companyId: string, provider: IntegrationProvider) {
  const integration = await db.companyIntegration.findUnique({
    where: {
      companyId_provider: {
        companyId,
        provider,
      },
    },
  });

  if (!integration) return null;

  return {
    ...integration,
    credentials: integration.credentials as EncryptedCredentials,
  };
}

import "server-only";
import { db } from "@/app/_lib/prisma";
import { CompanyIntegrationDto, EncryptedCredentials } from "./types";

export async function getCompanyIntegrations(companyId: string): Promise<CompanyIntegrationDto[]> {
  const integrations = await db.companyIntegration.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });

  return integrations.map((integration) => {
    // Cast do JSON para o formato esperado
    const credentials = integration.credentials as EncryptedCredentials | null;
    
    return {
      id: integration.id,
      provider: integration.provider,
      isEnabled: integration.isEnabled,
      config: {
        // Apenas enviamos dados públicos ao Client, como o merchantId (handle).
        merchantId: credentials?.merchantId || undefined,
      },
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  });
}

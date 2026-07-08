import { Metadata } from "next";
import { IntegrationsHub } from "./_components/integrations-hub";
import { getCompanyIntegrations } from "@/app/_data-access/integration/get-company-integrations";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole } from "@/app/_lib/rbac";
import { db } from "@/app/_lib/prisma";
import { AlertCircle, Zap } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/app/_components/ui/alert";
import { Separator } from "@/app/_components/ui/separator";

export const metadata: Metadata = {
  title: "Integrações | KIPO",
  description: "Gerencie suas integrações com plataformas externas.",
};

export default async function IntegrationsPage() {
  const companyId = await getCurrentCompanyId();

  // Apenas donos e admins podem acessar esta página
  await assertRole(["OWNER", "ADMIN"]);

  const integrations = await getCompanyIntegrations(companyId);

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { slug: true, mpMarketplaceToken: true, mpCheckoutEnabled: true },
  });

  if (!company) return null;

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Hub de Integrações
          </h2>
          <p className="mt-1 text-muted-foreground">
            Conecte o KIPO com outras plataformas para automatizar seu negócio.
          </p>
        </div>
      </div>

      <Separator className="my-6" />

      <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
        <AlertCircle className="h-4 w-4 stroke-current" />
        <AlertTitle>Como funcionam as integrações?</AlertTitle>
        <AlertDescription>
          Ao ativar uma integração, o KIPO passa a se comunicar automaticamente
          com a plataforma conectada. O Mercado Pago, por exemplo, permite que
          seus clientes paguem a comanda direto no celular deles através do PIX ou Cartão.
        </AlertDescription>
      </Alert>

      <IntegrationsHub
        initialIntegrations={integrations}
        companyId={companyId}
        companySlug={company.slug}
        mpMarketplaceToken={company.mpMarketplaceToken}
        mpCheckoutEnabled={company.mpCheckoutEnabled}
      />
    </div>
  );
}

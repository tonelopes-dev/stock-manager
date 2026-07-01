import { Metadata } from "next";
import { IntegrationsHub } from "./_components/integrations-hub";
import { getCompanyIntegrations } from "@/app/_data-access/integration/get-company-integrations";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole } from "@/app/_lib/rbac";
import { AlertCircle, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
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

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hub de Integrações</h2>
          <p className="text-muted-foreground mt-1">
            Conecte o KIPO com outras plataformas para automatizar seu negócio.
          </p>
        </div>
        <div className="hidden md:flex bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full items-center gap-2 font-medium">
          <Zap className="h-4 w-4" />
          <span>Automação Ativa</span>
        </div>
      </div>

      <Separator className="my-6" />

      <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-200">
        <AlertCircle className="h-4 w-4 stroke-current" />
        <AlertTitle>Como funcionam as integrações?</AlertTitle>
        <AlertDescription>
          Ao ativar uma integração, o KIPO passa a se comunicar automaticamente com a plataforma conectada. 
          A InfinityPay, por exemplo, permite que seus clientes paguem a comanda direto no celular deles.
        </AlertDescription>
      </Alert>

      <IntegrationsHub 
        initialIntegrations={integrations} 
        companyId={companyId} 
      />
    </div>
  );
}

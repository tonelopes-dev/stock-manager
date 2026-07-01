import { notFound } from "next/navigation";
import { getMenuDataBySlug } from "@/app/_data-access/menu/get-menu-data";
import { MyOrdersClient } from "./_components/my-orders-client";
import { getCompanyIntegrations } from "@/app/_data-access/integration/get-company-integrations";
import { IntegrationProvider } from "@prisma/client";

interface MyOrdersPageProps {
  params: Promise<{
    companySlug: string;
  }>;
}

export default async function MyOrdersPage({ params }: MyOrdersPageProps) {
  const { companySlug } = await params;
  if (companySlug === "undefined") return notFound();
  const menuData = await getMenuDataBySlug(companySlug);

  if (!menuData) {
    return notFound();
  }

  // Verifica se a integração InfinitePay está ativa para este estabelecimento
  const integrations = await getCompanyIntegrations(menuData.id);
  const infinityPayIntegration = integrations.find(
    (i) => i.provider === IntegrationProvider.INFINITYPAY && i.isEnabled
  );
  const infinityPayEnabled = !!infinityPayIntegration;

  return (
    <div className="min-h-screen bg-muted">
      <MyOrdersClient
        companyId={menuData.id}
        companySlug={menuData.slug}
        infinityPayEnabled={infinityPayEnabled}
      />
    </div>
  );
}

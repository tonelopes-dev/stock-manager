import { getMenuDataBySlug } from "@/app/_data-access/menu/get-menu-data";
import { db } from "@/app/_lib/prisma";
import { notFound } from "next/navigation";
import { MyOrdersClient } from "./_components/my-orders-client";

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

  // Verifica se a empresa tem o Mercado Pago conectado E se a flag de checkout está ativa
  const company = await db.company.findUnique({
    where: { id: menuData.id },
    select: { mpMarketplaceToken: true, mpMarketplacePublicKey: true, mpCheckoutEnabled: true },
  });

  const paymentGatewayConfig = (company?.mpMarketplaceToken && company?.mpCheckoutEnabled) 
    ? { provider: "MERCADOPAGO", publicKey: company.mpMarketplacePublicKey || undefined } 
    : null;

  return (
    <div className="min-h-screen bg-muted">
      <MyOrdersClient
        companyId={menuData.id}
        companySlug={menuData.slug}
        paymentGatewayConfig={paymentGatewayConfig}
      />
    </div>
  );
}

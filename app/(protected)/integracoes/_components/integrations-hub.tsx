"use client";

import { IntegrationCard } from "./integration-card";
import { CreditCard } from "lucide-react";

interface IntegrationsHubProps {
  companyId: string;
  companySlug: string;
  mpMarketplaceToken: string | null;
  mpCheckoutEnabled: boolean;
}

// Configuração estática dos provedores suportados no sistema
const SUPPORTED_PROVIDERS = [
  {
    provider: "MERCADOPAGO",
    name: "Mercado Pago Checkout",
    description: "Receba pagamentos das suas comandas de forma ágil e segura através do Checkout Transparente do Mercado Pago.",
    logoUrl: "/logos/mercado-pago-logo-png_seeklogo-653482.png",
    color: "bg-white",
    textColor: "text-blue-500",
    badge: "Disponível",
    isComingSoon: false,
  },
  {
    provider: "IFOOD",
    name: "iFood (Em Breve)",
    description: "Sincronize seu cardápio, receba e gerencie pedidos do iFood direto no KDS do KIPO.",
    logoUrl: "/logos/logo-ifood-smile-512x512.png",
    color: "bg-white",
    textColor: "text-red-500",
    badge: "Em Breve",
    isComingSoon: true,
  },
  {
    provider: "WHATSAPP_BUSINESS",
    name: "WhatsApp Business (Em Breve)",
    description: "Notifique clientes sobre o status dos pedidos e envie campanhas de marketing automaticamente.",
    logoUrl: "/logos/WhatsApp_Business_icon.png",
    color: "bg-white",
    textColor: "text-green-500",
    badge: "Em Breve",
    isComingSoon: true,
  },
];

export function IntegrationsHub({ companyId, companySlug, mpMarketplaceToken, mpCheckoutEnabled }: IntegrationsHubProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {SUPPORTED_PROVIDERS.map((config) => (
        <IntegrationCard
          key={config.provider}
          config={config}
          companyId={companyId}
          companySlug={companySlug}
          mpMarketplaceToken={config.provider === "MERCADOPAGO" ? mpMarketplaceToken : null}
          mpCheckoutEnabled={config.provider === "MERCADOPAGO" ? mpCheckoutEnabled : false}
        />
      ))}
    </div>
  );
}

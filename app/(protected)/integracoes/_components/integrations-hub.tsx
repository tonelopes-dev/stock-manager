"use client";

import { CompanyIntegrationDto } from "@/app/_data-access/integration/types";
import { IntegrationProvider } from "@prisma/client";
import { IntegrationCard } from "./integration-card";
import { InfinityPayConfigSheet } from "./infinitypay-config-sheet";
import { MercadoPagoConfigSheet } from "./mercadopago-config-sheet";
import { useState } from "react";
import { CreditCard, MessageSquare, Utensils, SmartphoneNfc } from "lucide-react";

interface IntegrationsHubProps {
  initialIntegrations: CompanyIntegrationDto[];
  companyId: string;
}

// Configuração estática dos provedores suportados no sistema
const SUPPORTED_PROVIDERS = [
  {
    provider: IntegrationProvider.INFINITYPAY,
    name: "InfinityPay Checkout",
    description: "Receba pagamentos das suas comandas diretamente no celular do cliente via PIX e Cartão.",
    logoUrl: "/logos/logo_infinite-pay_zFLqIS.png",
    color: "bg-white",
    textColor: "text-emerald-500",
    badge: "Disponível",
    isComingSoon: false,
  },
  {
    provider: "MERCADOPAGO" as IntegrationProvider,
    name: "Mercado Pago Checkout",
    description: "Receba pagamentos das suas comandas de forma ágil e segura através do Checkout Pro do Mercado Pago.",
    logoUrl: "/logos/mercado-pago-logo-png_seeklogo-653482.png",
    color: "bg-white",
    textColor: "text-blue-500",
    badge: "Disponível",
    isComingSoon: false,
  },
  {
    provider: IntegrationProvider.IFOOD,
    name: "iFood (Em Breve)",
    description: "Sincronize seu cardápio, receba e gerencie pedidos do iFood direto no KDS do KIPO.",
    logoUrl: "/logos/logo-ifood-smile-512x512.png",
    color: "bg-white",
    textColor: "text-red-500",
    badge: "Em Breve",
    isComingSoon: true,
  },
  {
    provider: IntegrationProvider.WHATSAPP_BUSINESS,
    name: "WhatsApp Business (Em Breve)",
    description: "Notifique clientes sobre o status dos pedidos e envie campanhas de marketing automaticamente.",
    logoUrl: "/logos/WhatsApp_Business_icon.png",
    color: "bg-white",
    textColor: "text-green-500",
    badge: "Em Breve",
    isComingSoon: true,
  },
];

export function IntegrationsHub({ initialIntegrations, companyId }: IntegrationsHubProps) {
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);

  const handleConfigure = (provider: IntegrationProvider) => {
    setSelectedProvider(provider);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SUPPORTED_PROVIDERS.map((config) => {
          // Busca se o usuário já tem essa integração configurada no banco
          const activeIntegration = initialIntegrations.find(
            (i) => i.provider === config.provider
          );

          return (
            <IntegrationCard
              key={config.provider}
              config={config as any} // workaround para tipagem do MERCADOPAGO se prisma não estiver atualizado localmente
              integration={activeIntegration}
              companyId={companyId}
              onConfigure={() => handleConfigure(config.provider as IntegrationProvider)}
            />
          );
        })}
      </div>

      {/* Sheets de Configuração Específicas */}
      <InfinityPayConfigSheet
        open={selectedProvider === IntegrationProvider.INFINITYPAY}
        onOpenChange={(open) => !open && setSelectedProvider(null)}
        companyId={companyId}
        integration={initialIntegrations.find((i) => i.provider === IntegrationProvider.INFINITYPAY)}
      />
      
      <MercadoPagoConfigSheet
        open={selectedProvider === "MERCADOPAGO"}
        onOpenChange={(open) => !open && setSelectedProvider(null)}
        companyId={companyId}
        integration={initialIntegrations.find((i) => i.provider === "MERCADOPAGO")}
      />
    </>
  );
}

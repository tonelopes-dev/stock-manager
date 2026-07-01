"use client";

import { CompanyIntegrationDto } from "@/app/_data-access/integration/types";
import { IntegrationProvider } from "@prisma/client";
import { IntegrationCard } from "./integration-card";
import { InfinityPayConfigSheet } from "./infinitypay-config-sheet";
import { useState } from "react";
import { CreditCard, MessageSquare, Utensils } from "lucide-react";

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
    icon: CreditCard,
    color: "bg-emerald-500",
    textColor: "text-emerald-500",
    badge: "Disponível",
    isComingSoon: false,
  },
  {
    provider: IntegrationProvider.IFOOD,
    name: "iFood (Em Breve)",
    description: "Sincronize seu cardápio, receba e gerencie pedidos do iFood direto no KDS do KIPO.",
    icon: Utensils,
    color: "bg-red-500",
    textColor: "text-red-500",
    badge: "Em Breve",
    isComingSoon: true,
  },
  {
    provider: IntegrationProvider.WHATSAPP_BUSINESS,
    name: "WhatsApp Business (Em Breve)",
    description: "Notifique clientes sobre o status dos pedidos e envie campanhas de marketing automaticamente.",
    icon: MessageSquare,
    color: "bg-green-500",
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
              config={config}
              integration={activeIntegration}
              companyId={companyId}
              onConfigure={() => handleConfigure(config.provider)}
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
    </>
  );
}

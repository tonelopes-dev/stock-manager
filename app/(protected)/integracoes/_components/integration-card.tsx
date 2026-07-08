"use client";

import { CompanyIntegrationDto } from "@/app/_data-access/integration/types";
import { IntegrationProvider } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Switch } from "@/app/_components/ui/switch";
import { Badge } from "@/app/_components/ui/badge";
import { Settings2, LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/app/_lib/utils";
import { useAction } from "next-safe-action/hooks";
import { toggleIntegration } from "@/app/_actions/integration/toggle-integration";
import { toast } from "sonner";
import { disconnectMercadoPagoAction } from "@/app/_actions/integration/disconnect-mercadopago";

interface ProviderConfig {
  provider: IntegrationProvider;
  name: string;
  description: string;
  icon?: LucideIcon;
  logoUrl?: string;
  color: string;
  textColor: string;
  badge: string;
  isComingSoon: boolean;
}

interface IntegrationCardProps {
  config: ProviderConfig;
  integration?: CompanyIntegrationDto;
  companyId: string;
  companySlug?: string;
  mpMarketplaceToken?: string | null;
  onConfigure: () => void;
}

export function IntegrationCard({ config, integration, companyId, companySlug, mpMarketplaceToken, onConfigure }: IntegrationCardProps) {
  const Icon = config.icon;
  const isConfigured = !!integration;
  const isEnabled = integration?.isEnabled ?? false;
  
  // Especifico para Mercado Pago
  const isMercadoPago = config.provider === "MERCADOPAGO";
  const isMpConnected = isMercadoPago && !!mpMarketplaceToken;

  const { execute, isExecuting } = useAction(toggleIntegration, {
    onSuccess: () => {
      toast.success(
        isEnabled
          ? `${config.name} foi desativada.`
          : `${config.name} foi ativada com sucesso!`
      );
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao alterar o status da integração.");
    }
  });

  const handleToggle = (checked: boolean) => {
    if (!integration) return;
    execute({
      id: integration.id,
      companyId,
      isEnabled: checked
    });
  };

  const { execute: executeDisconnect, isExecuting: isDisconnecting } = useAction(disconnectMercadoPagoAction, {
    onSuccess: () => {
      toast.success("Conta do Mercado Pago desconectada.");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao desconectar conta.");
    }
  });

  const handleMpDisconnect = () => {
    executeDisconnect({ companyId });
  };

  return (
    <Card className={cn(
      "flex flex-col transition-all duration-200 overflow-hidden",
      isEnabled ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "hover:border-primary/30",
      config.isComingSoon && "opacity-75 grayscale-[0.5]"
    )}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-lg text-white shadow-sm flex items-center justify-center overflow-hidden shrink-0", 
            config.color, 
            "h-10 w-10",
            !config.logoUrl && "p-2.5"
          )}>
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.name} className="h-full w-full object-cover" />
            ) : Icon ? (
              <Icon className="h-5 w-5" />
            ) : null}
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{config.name}</CardTitle>
            <div className="mt-1">
              <Badge variant={config.isComingSoon ? "secondary" : (isEnabled || isMpConnected ? "default" : "outline")}>
                {config.isComingSoon 
                  ? "Em breve" 
                  : (isMpConnected ? "Conta Conectada" : (isEnabled ? "Ativo" : (isConfigured ? "Desativado" : "Não configurado")))}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Toggle só aparece se estiver configurado e não for coming soon */}
        {!config.isComingSoon && isConfigured && (
          <div className="flex items-center space-x-2 bg-muted/50 p-1.5 rounded-full">
            {isExecuting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isExecuting}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1">
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          {config.description}
        </CardDescription>
      </CardContent>
      
      <CardFooter className="pt-4 border-t bg-muted/20">
        {isMercadoPago ? (
          isMpConnected ? (
            <Button 
              variant="destructive"
              className="w-full gap-2"
              onClick={handleMpDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Desconectar"}
            </Button>
          ) : (
            <Button 
              variant="default"
              className="w-full gap-2"
              asChild
            >
              <a href={`/api/integrations/mercadopago/oauth?companyId=${companyId}&companySlug=${companySlug}`}>
                Conectar Conta
              </a>
            </Button>
          )
        ) : (
          <Button 
            variant={isConfigured ? "outline" : "default"} 
            className={cn("w-full gap-2", isConfigured && "bg-background")}
            onClick={onConfigure}
            disabled={config.isComingSoon}
          >
            {isConfigured ? (
              <>
                <Settings2 className="h-4 w-4" />
                Configurar
              </>
            ) : (
              "Conectar"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

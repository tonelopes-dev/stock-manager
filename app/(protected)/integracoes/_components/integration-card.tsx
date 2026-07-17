"use client";

import { disconnectMercadoPagoAction } from "@/app/_actions/integration/disconnect-mercadopago";
import { toggleMpCheckoutAction } from "@/app/_actions/integration/toggle-mp-checkout";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Switch } from "@/app/_components/ui/switch";
import { cn } from "@/app/_lib/utils";
import { Loader2, LucideIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProviderConfig {
  provider: string;
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
  companyId: string;
  companySlug?: string;
  mpMarketplaceToken?: string | null;
  mpCheckoutEnabled?: boolean;
}

export function IntegrationCard({ config, companyId, companySlug, mpMarketplaceToken, mpCheckoutEnabled }: IntegrationCardProps) {
  const Icon = config.icon;
  const isMercadoPago = config.provider === "MERCADOPAGO";
  const isMpConnected = isMercadoPago && !!mpMarketplaceToken;
  const router = useRouter();

  const { execute: executeToggleCheckout, isExecuting: isTogglingCheckout } = useAction(toggleMpCheckoutAction, {
    onSuccess: () => {
      toast.success(
        mpCheckoutEnabled
          ? "Pagamento no cardápio desabilitado."
          : "Pagamento no cardápio habilitado com sucesso!"
      );
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao alterar o status do checkout.");
    }
  });

  const handleToggleCheckout = (checked: boolean) => {
    executeToggleCheckout({ companyId, isEnabled: checked });
  };

  const { execute: executeDisconnect, isExecuting: isDisconnecting } = useAction(disconnectMercadoPagoAction, {
    onSuccess: () => {
      toast.success("Conta do Mercado Pago desconectada.");
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao desconectar conta.");
    }
  });

  return (
    <Card className={cn(
      "flex flex-col transition-all duration-200 overflow-hidden",
      isMpConnected ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "hover:border-primary/30",
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
              <Badge variant={config.isComingSoon ? "secondary" : (isMpConnected ? "default" : "outline")}>
                {config.isComingSoon
                  ? "Em breve"
                  : (isMpConnected ? "Conta Conectada" : "Não configurado")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Toggle para MP Checkout (só aparece se estiver conectado) */}
        {isMpConnected && (
          <div className="flex items-center space-x-2 bg-muted/50 p-1.5 rounded-full" title="Habilitar pagamento no cardápio">
            {isTogglingCheckout && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Switch
              checked={mpCheckoutEnabled}
              onCheckedChange={handleToggleCheckout}
              disabled={isTogglingCheckout}
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
              onClick={() => executeDisconnect({ companyId })}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Desconectar"}
            </Button>
          ) : (
            <Button variant="default" className="w-full gap-2" asChild>
              <a href={`/api/integrations/mercadopago/oauth?companyId=${companyId}&companySlug=${companySlug}`}>
                Conectar Conta
              </a>
            </Button>
          )
        ) : (
          <Button
            variant="outline"
            className="w-full gap-2 bg-background"
            disabled={config.isComingSoon}
          >
            Em Breve
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

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

interface ProviderConfig {
  provider: IntegrationProvider;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  textColor: string;
  badge: string;
  isComingSoon: boolean;
}

interface IntegrationCardProps {
  config: ProviderConfig;
  integration?: CompanyIntegrationDto;
  companyId: string;
  onConfigure: () => void;
}

export function IntegrationCard({ config, integration, companyId, onConfigure }: IntegrationCardProps) {
  const Icon = config.icon;
  const isConfigured = !!integration;
  const isEnabled = integration?.isEnabled ?? false;

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

  return (
    <Card className={cn(
      "flex flex-col transition-all duration-200 overflow-hidden",
      isEnabled ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "hover:border-primary/30",
      config.isComingSoon && "opacity-75 grayscale-[0.5]"
    )}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-lg text-white shadow-sm", config.color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{config.name}</CardTitle>
            <div className="mt-1">
              <Badge variant={config.isComingSoon ? "secondary" : (isEnabled ? "default" : "outline")}>
                {config.isComingSoon 
                  ? "Em breve" 
                  : (isEnabled ? "Ativo" : (isConfigured ? "Desativado" : "Não configurado"))}
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
      </CardFooter>
    </Card>
  );
}

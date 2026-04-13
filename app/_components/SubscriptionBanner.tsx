"use client";

import { AlertTriangle, Info, X, Loader2Icon, ArrowRightIcon } from "lucide-react";
import { useSubscription } from "./SubscriptionContext";
import { Button } from "@/app/_components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { createMercadoPagoPreference } from "@/app/_actions/mercadopago/create-preference";
import { toast } from "sonner";
import { addMonths, format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export const SubscriptionBanner = () => {
  const {
    isBannerVisible,
    setIsBannerVisible,
    subscriptionLevel,
    daysRemaining,
    expiresAt,
  } = useSubscription();

  const checkoutAction = useAction(createMercadoPagoPreference, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
      console.error(error);
    },
  });

  if (!isBannerVisible || subscriptionLevel === "safe") return null;

  const isUrgent = subscriptionLevel === "urgent";
  const isExpired = subscriptionLevel === "expired";
  const isLoading = checkoutAction.status === "executing";

  const bgColor = isUrgent || isExpired ? "bg-destructive" : "bg-orange-600";
  const textColor = "text-background";

  const now = new Date();
  const baseDate = (expiresAt && isAfter(expiresAt, now)) ? expiresAt : now;
  const nextPeriodEnd = addMonths(baseDate, 1);
  const renewalDatePreview = format(nextPeriodEnd, "dd/MM/yyyy", { locale: ptBR });

  return (
    <div
      className={`${bgColor} ${textColor} sticky top-0 z-[100] w-full px-4 py-2 shadow-md transition-all duration-300`}
    >
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 md:flex-row">
        <div className="flex items-center gap-2 text-sm font-medium md:text-base">
          {isUrgent || isExpired ? (
            <div className="flex animate-pulse items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div className="flex flex-col">
                <span>
                  {isExpired
                    ? "Sua assinatura expirou. Regularize agora para recuperar o acesso."
                    : `URGENTE: Seu acesso expira em ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}.`}
                </span>
                <span className="text-xs opacity-90">
                  Renovando agora, seu plano será estendido em 1 mês (vencimento em{" "}
                  <span className="font-bold">{renewalDatePreview}</span>).
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 shrink-0" />
              <div className="flex flex-col">
                <span>
                  Sua assinatura vence em {daysRemaining} dias. Renove agora para
                  evitar bloqueios.
                </span>
                <span className="text-xs opacity-90">
                  Renovando agora, seu plano será estendido em 1 mês (vencimento em{" "}
                  <span className="font-bold">{renewalDatePreview}</span>).
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => checkoutAction.execute()}
            disabled={isLoading}
            size="sm"
            className="h-8 rounded-full bg-background px-4 text-xs font-bold text-foreground transition-colors hover:bg-muted"
          >
            {isLoading && <Loader2Icon className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {isExpired ? "Regularizar Agora" : "Renovar Assinatura"}
            {!isLoading && <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsBannerVisible(false)}
            className="h-8 w-8 rounded-full text-background hover:bg-background/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

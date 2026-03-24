"use client";

import Link from "next/link";
import { AlertTriangle, Info, X } from "lucide-react";
import { useSubscription } from "./SubscriptionContext";
import { Button } from "@/app/_components/ui/button";

export const SubscriptionBanner = () => {
  const {
    isBannerVisible,
    setIsBannerVisible,
    subscriptionLevel,
    daysRemaining,
  } = useSubscription();

  if (!isBannerVisible || subscriptionLevel === "safe") return null;

  const isUrgent = subscriptionLevel === "urgent";
  const isExpired = subscriptionLevel === "expired";

  const bgColor = isUrgent || isExpired ? "bg-destructive" : "bg-orange-500";
  const textColor = "text-background";

  return (
    <div
      className={`${bgColor} ${textColor} sticky top-0 z-[100] w-full px-4 py-2 shadow-md transition-all duration-300`}
    >
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 md:flex-row">
        <div className="flex items-center gap-2 text-sm font-medium md:text-base">
          {isUrgent || isExpired ? (
            <div className="flex animate-pulse items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>
                {isExpired
                  ? "Sua assinatura expirou. Regularize agora para recuperar o acesso."
                  : `URGENTE: Seu acesso expira em ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}. Clique aqui para pagar e continuar usando o sistema.`}
              </span>
            </div>
          ) : (
            <>
              <Info className="h-5 w-5 shrink-0" />
              <span>
                Sua assinatura vence em {daysRemaining} dias. Renove agora para
                evitar bloqueios.
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/plans"
            className="whitespace-nowrap rounded-full bg-background px-4 py-1.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            {isExpired ? "Regularizar Agora" : "Renovar Assinatura"}
          </Link>

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

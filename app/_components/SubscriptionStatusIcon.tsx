"use client";

import { useSubscription } from "./SubscriptionContext";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";

export const SubscriptionStatusIcon = () => {
  const { toggleBanner, subscriptionLevel, daysRemaining } = useSubscription();

  if (subscriptionLevel === "safe") return null;

  const isUrgent =
    subscriptionLevel === "urgent" || subscriptionLevel === "expired";
  const iconColor = isUrgent ? "text-red-500" : "text-yellow-500";
  const animationClass = isUrgent ? "animate-pulse" : "";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBanner}
            className={`relative ${animationClass}`}
          >
            {isUrgent ? (
              <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
            ) : (
              <AlertCircle className={`h-5 w-5 ${iconColor}`} />
            )}
            <span
              className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white`}
            >
              !
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {subscriptionLevel === "expired"
              ? "Assinatura Expirada"
              : `Assinatura vence em ${daysRemaining} dias`}
          </p>
          <p className="text-xs text-muted-foreground">
            Clique para ver detalhes
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

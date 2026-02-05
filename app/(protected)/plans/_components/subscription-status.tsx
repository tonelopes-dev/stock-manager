"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/app/_components/ui/badge";
import { checkPlanStatus } from "@/app/_actions/stripe/check-plan-status";
import { Loader2Icon, AlertCircleIcon, CheckCircle2Icon, ClockIcon } from "lucide-react";

interface SubscriptionStatusProps {
  initialPlan: string;
}

export type SubStatus = "FREE" | "PROCESSING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export const SubscriptionStatus = ({ initialPlan }: SubscriptionStatusProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState(initialPlan);
  const [isProcessing, setIsProcessing] = useState(searchParams.get("success") === "true" && initialPlan === "FREE");

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isProcessing) {
      interval = setInterval(async () => {
        const { plan } = await checkPlanStatus();
        if (plan === "PRO") {
          setCurrentPlan("PRO");
          setIsProcessing(false);
          router.refresh();
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing, router]);

  // Derived state mapping
  const getStatus = (plan: string, subId: string | null): SubStatus => {
    if (isProcessing) return "PROCESSING";
    if (plan === "PRO") return "ACTIVE";
    
    // If plan is FREE but we have a subscription ID, something happened (CANCELED or PAST_DUE)
    if (subId) {
      return "CANCELED"; // In our webhook logic, anything not active/trialing becomes FREE
    }
    
    return "FREE";
  };

  const status = getStatus(currentPlan, searchParams.get("subId") || null); // Fallback for demonstration

  const configs: Record<SubStatus, { label: string; icon: any; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
    FREE: {
      label: "Plano Gratuito",
      icon: null,
      variant: "secondary",
    },
    PROCESSING: {
      label: "Processando Upgrade...",
      icon: <Loader2Icon className="h-3 w-3 animate-spin" />,
      variant: "outline",
      className: "border-primary text-primary animate-pulse",
    },
    ACTIVE: {
      label: "Assinatura Ativa",
      icon: <CheckCircle2Icon className="h-3 w-3" />,
      variant: "default",
      className: "bg-green-100 text-green-700 hover:bg-green-100 border-none",
    },
    PAST_DUE: {
      label: "Pagamento Pendente",
      icon: <AlertCircleIcon className="h-3 w-3" />,
      variant: "destructive",
    },
    CANCELED: {
      label: "Assinatura Cancelada",
      icon: <ClockIcon className="h-3 w-3" />,
      variant: "outline",
    },
  };

  const config = configs[status];

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className={`flex items-center gap-1.5 px-3 py-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
      
      {status === "PROCESSING" && (
        <span className="text-xs text-muted-foreground italic">
           Confirmando sua assinatura...
        </span>
      )}
    </div>
  );
};

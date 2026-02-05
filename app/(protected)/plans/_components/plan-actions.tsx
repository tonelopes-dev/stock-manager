"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/app/_components/ui/button";
import { createCheckoutSession } from "@/app/_actions/stripe/create-checkout-session";
import { createPortalSession } from "@/app/_actions/stripe/create-portal-session";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

interface PlanActionsProps {
  planName: string;
  isPro: boolean;
  isCurrent: boolean;
  actionLabel: string;
}

const PlanActions = ({ planName, isPro, isCurrent, actionLabel }: PlanActionsProps) => {
  const checkoutAction = useAction(createCheckoutSession, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error("Erro ao iniciar assinatura. Tente novamente.");
      console.error(error);
    },
  });

  const portalAction = useAction(createPortalSession, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error("Erro ao acessar portal. Tente novamente.");
      console.error(error);
    },
  });

  const handleAction = () => {
    if (planName === "Pro") {
      if (isPro) {
        portalAction.execute();
      } else {
        checkoutAction.execute();
      }
    }
  };

  const isLoading = checkoutAction.status === "executing" || portalAction.status === "executing";

  if (isCurrent && planName === "Free") {
    return (
      <Button className="w-full" disabled variant="outline">
        {actionLabel}
      </Button>
    );
  }

  return (
    <Button
      className="w-full"
      variant={planName === "Pro" ? "default" : "outline"}
      onClick={handleAction}
      disabled={isLoading || (isCurrent && planName === "Free")}
    >
      {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
      {actionLabel}
    </Button>
  );
};

export default PlanActions;

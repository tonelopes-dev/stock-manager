"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/app/_components/ui/button";
import { createCheckoutSession } from "@/app/_actions/stripe/create-checkout-session";
import { createPortalSession } from "@/app/_actions/stripe/create-portal-session";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { useSearchParams } from "next/navigation";

interface PlanActionsProps {
  planName: string;
  isPro: boolean;
  isCurrent: boolean;
  actionLabel: string;
  externalProcessing?: boolean;
  externalLink?: string | null;
  externalLabel?: string;
}

const PlanActions = ({
  planName,
  isPro,
  isCurrent,
  actionLabel,
  externalProcessing,
  externalLink,
  externalLabel,
}: PlanActionsProps) => {
  const searchParams = useSearchParams();
  const isRedirectingSuccess = searchParams.get("success") === "true";
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
    if (externalLink) {
      window.location.href = externalLink;
      return;
    }

    if (planName === "Pro") {
      if (isPro) {
        portalAction.execute();
      } else {
        checkoutAction.execute();
      }
    }
  };

  const isLoading =
    checkoutAction.status === "executing" ||
    portalAction.status === "executing" ||
    externalProcessing ||
    (isRedirectingSuccess && !isPro);

  if (isCurrent && planName === "Free" && !externalLink) {
    return (
      <Button className="w-full" disabled variant="outline">
        {actionLabel}
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {externalLink && (
        <Button
          className="w-full bg-amber-600 font-bold text-white hover:bg-amber-700"
          onClick={() => (window.location.href = externalLink)}
        >
          {externalLabel || "Visualizar Boleto"}
        </Button>
      )}
      <Button
        className="w-full"
        variant={planName === "Pro" ? "default" : "outline"}
        onClick={handleAction}
        disabled={
          isLoading || (isCurrent && planName === "Free" && !externalLink)
        }
      >
        {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
        {isRedirectingSuccess ? "Processando..." : actionLabel}
      </Button>
    </div>
  );
};

export default PlanActions;

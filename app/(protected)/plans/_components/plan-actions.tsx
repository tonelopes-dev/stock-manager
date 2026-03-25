"use client";

import { useAction } from "next-safe-action/hooks";
import { Button } from "@/app/_components/ui/button";
import { createMercadoPagoPreference } from "@/app/_actions/mercadopago/create-preference";
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
  const checkoutAction = useAction(createMercadoPagoPreference, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
      console.error(error);
    },
  });

  const handleAction = () => {
    if (externalLink) {
      window.location.href = externalLink;
      return;
    }

    if (planName === "Pro" && !isPro) {
      checkoutAction.execute();
    }
  };

  const isLoading =
    checkoutAction.status === "executing" ||
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
          className="w-full bg-orange-500 font-bold text-background hover:bg-orange-500"
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

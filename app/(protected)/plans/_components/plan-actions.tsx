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
  allowRenewal?: boolean;
  externalProcessing?: boolean;
  externalLink?: string | null;
  externalLabel?: string;
  renewalDatePreview?: string | null;
}

const PlanActions = ({
  planName,
  isPro,
  isCurrent,
  actionLabel,
  allowRenewal,
  externalProcessing,
  externalLink,
  externalLabel,
  renewalDatePreview,
}: PlanActionsProps) => {
  const searchParams = useSearchParams();
  const isRedirectingSuccess = searchParams.get("success") === "true";
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

  const handleAction = () => {
    if (externalLink) {
      window.open(externalLink, "_blank");
      return;
    }

    // Allow checkout if it's the Pro plan AND (not Pro OR allowed to renew)
    if (planName === "Pro" && (!isPro || allowRenewal)) {
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
          onClick={() => window.open(externalLink, "_blank")}
        >
          {externalLabel || "Visualizar Boleto"}
        </Button>
      )}
      <Button
        className="w-full transition-all active:scale-95"
        variant={(planName === "Pro" || allowRenewal) ? "default" : "outline"}
        onClick={handleAction}
        disabled={
          isLoading || (isCurrent && planName === "Free" && !externalLink)
        }
      >
        {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
        {isRedirectingSuccess ? "Processando..." : actionLabel}
      </Button>

      {renewalDatePreview && (
        <p className="px-1 text-center text-xs text-muted-foreground">
          Renovando agora, seu plano será estendido em 1 mês (vencimento em{" "}
          <span className="font-bold text-foreground">{renewalDatePreview}</span>
          ).
        </p>
      )}
    </div>
  );
};

export default PlanActions;

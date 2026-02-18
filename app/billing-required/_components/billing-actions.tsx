"use client";

import { Button } from "@/app/_components/ui/button";
import { createPortalSession } from "@/app/_actions/stripe/create-portal-session";
import { toast } from "sonner";
import { CreditCardIcon, LayoutGridIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export const BillingActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePayment = async () => {
    setIsLoading(true);
    try {
      const result = await createPortalSession();
      if (result?.data?.url) {
        window.location.href = result.data.url;
      } else {
        toast.error("Erro ao redirecionar para o portal de faturamento.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
      <Button
        onClick={handleUpdatePayment}
        disabled={isLoading}
        size="lg"
        className="gap-2"
      >
        {isLoading ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCardIcon className="h-4 w-4" />
        )}
        Atualizar Pagamento
      </Button>

      <Button variant="outline" size="lg" asChild className="gap-2">
        <Link href="/plans">
          <LayoutGridIcon className="h-4 w-4" />
          Ver Planos
        </Link>
      </Button>
    </div>
  );
};

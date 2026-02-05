"use client";

import { useAction } from "next-safe-action/hooks";
import { createCustomerPortalSession } from "@/app/_actions/stripe/create-customer-portal";
import { Button } from "@/app/_components/ui/button";
import { CreditCardIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export const ManageBillingButton = () => {
  const { execute, isPending } = useAction(createCustomerPortalSession, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
        console.error(error);
        toast.error("Erro ao abrir o portal de faturamento. Tente novamente.");
    }
  });

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-[10px] h-6 px-2 text-primary font-semibold hover:bg-primary/5"
      onClick={() => execute()}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
      ) : (
        <CreditCardIcon className="mr-1 h-3 w-3" />
      )}
      Faturamento
    </Button>
  );
};

"use client";

import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { processTransparentPayment } from "@/app/_actions/integration/process-transparent-payment";

interface MercadoPagoBricksFormProps {
  publicKey: string;
  preferenceId: string;
  amount: number;
  companyId: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

export function MercadoPagoBricksForm({
  publicKey,
  preferenceId,
  amount,
  companyId,
  onPaymentSuccess,
  onPaymentError,
}: MercadoPagoBricksFormProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Inicializa o Mercado Pago com a chave pública do estabelecimento
    if (publicKey) {
      initMercadoPago(publicKey, { locale: "pt-BR" });
    }
  }, [publicKey]);

  const { executeAsync } = useAction(processTransparentPayment);

  const initialization = {
    amount,
    // REMOVIDO: preferenceId. Passar preferenceId aqui faz o Bricks gerar um token amarrado à Preference.
    // Como no backend usamos `payment.create` (Transparent Checkout) puro, o MP rejeitava o token
    // com erro 2131 (Cannot infer Payment Method). Omitindo, geramos um token limpo.
  };

  const customization = {
    paymentMethods: {
      ticket: "all" as const,
      bankTransfer: "all" as const,
      creditCard: "all" as const,
      debitCard: "all" as const,
      mercadoPago: "all" as const,
    },
    visual: {
      style: {
        theme: "default" as const, // pode ser 'default', 'dark', 'flat', 'bootstrap'
        customVariables: {
          formBackgroundColor: "transparent",
          baseColor: "#10b981", // Emerald-500
        },
      },
      hidePaymentButton: false,
    },
  };

  const onSubmit: ComponentProps<typeof Payment>["onSubmit"] = async (formData, additionalData) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const result = await executeAsync({
          companyId,
          preferenceId,
          bricksPayload: formData as unknown as Record<string, unknown>,
        });

        if (result?.data?.success) {
          toast.success("Pagamento aprovado!");
          onPaymentSuccess(result.data.paymentId);
          resolve();
        } else if (result?.data?.status === "pending" || result?.data?.status === "in_process") {
          toast.success("Aguardando confirmação do pagamento.");
          onPaymentSuccess(result.data.paymentId); // Call success handler so parent can render StatusScreen
          resolve(); 
        } else {
          const errorMessage = result?.serverError || result?.data?.message || "Pagamento recusado.";
          toast.error(errorMessage);
          onPaymentError(errorMessage);
          reject();
        }
      } catch (error: unknown) {
        toast.error("Erro ao processar o pagamento.");
        if (error instanceof Error) {
          onPaymentError(error.message);
        } else {
          onPaymentError("Erro desconhecido");
        }
        reject();
      }
    });
  };

  const onError = async (error: unknown) => {
    console.error("MercadoPago Brick Error:", error);
    onPaymentError("Erro no formulário de pagamento.");
  };

  const onReady = async () => {
    setIsReady(true);
  };

  return (
    <div className="w-full relative min-h-[400px]">
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-xl">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Carregando ambiente seguro...
          </p>
        </div>
      )}
      
      <div className="w-full">
        {publicKey ? (
          <Payment
            initialization={initialization}
            customization={customization}
            onSubmit={onSubmit}
            onReady={onReady}
            onError={onError}
          />
        ) : (
          <div className="p-6 text-center text-red-500">
            Credenciais do Mercado Pago não encontradas.
          </div>
        )}
      </div>
    </div>
  );
}

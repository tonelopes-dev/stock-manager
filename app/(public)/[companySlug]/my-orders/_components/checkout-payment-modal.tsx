"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/app/_components/ui/sheet";
import { MercadoPagoBricksForm } from "./mercadopago-bricks-form";
import { StatusScreen } from "@mercadopago/sdk-react";

interface CheckoutPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicKey: string;
  preferenceId: string;
  amount: number;
  companyId: string;
  onPaymentSuccess?: (paymentId: string) => void;
}

export function CheckoutPaymentModal({
  open,
  onOpenChange,
  publicKey,
  preferenceId,
  amount,
  companyId,
  onPaymentSuccess,
}: CheckoutPaymentModalProps) {
  const [completedPaymentId, setCompletedPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Resetar estado quando fechar
      setTimeout(() => setCompletedPaymentId(null), 300);
    }
  }, [open]);

  const handlePaymentSuccess = (paymentId: string) => {
    setCompletedPaymentId(paymentId);
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentId);
    }
  };

  const handlePaymentError = (error: string) => {
    // Não fechamos, apenas deixamos o usuário ver o erro ou tentar novamente
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] sm:h-[85vh] rounded-t-3xl p-0 sm:max-w-[500px] sm:mx-auto">
        <SheetHeader className="p-6 pb-2 text-left bg-emerald-500/10 rounded-t-3xl">
          <SheetTitle className="text-2xl font-black">Pagamento</SheetTitle>
          <SheetDescription className="text-gray-600 font-medium">
            Escolha como prefere pagar sua comanda de{" "}
            <span className="font-bold text-gray-900">
              {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)}
            </span>
          </SheetDescription>
        </SheetHeader>
        
        <div className="p-6 overflow-y-auto h-[calc(100%-120px)] hide-scrollbar">
          {!completedPaymentId ? (
            <MercadoPagoBricksForm
              publicKey={publicKey}
              preferenceId={preferenceId}
              amount={amount}
              companyId={companyId}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <StatusScreen 
                initialization={{ paymentId: completedPaymentId }} 
                customization={{
                  visual: {
                    style: {
                      theme: "default",
                      customVariables: {
                        baseColor: "#10b981",
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { Button } from "@/app/_components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/app/_components/ui/sheet";
import { StatusScreen } from "@mercadopago/sdk-react";
import { CheckCircle2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MercadoPagoBricksForm } from "./mercadopago-bricks-form";

interface CheckoutPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicKey: string;
  preferenceId: string;
  amount: number;
  companyId: string;
  onPaymentSuccess?: (paymentId: string, status: string, pixBase64?: string, pixCopyPaste?: string) => void;
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
  const [pixData, setPixData] = useState<{ base64: string; copyPaste: string } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      // Resetar estado quando fechar
      setTimeout(() => {
        setCompletedPaymentId(null);
        setPixData(null);
        setHasCopied(false);
      }, 300);
    }
  }, [open]);

  const handlePaymentSuccess = (paymentId: string, status: string, pixBase64?: string, pixCopyPaste?: string) => {
    setCompletedPaymentId(paymentId);
    if (pixBase64 && pixCopyPaste) {
      setPixData({ base64: pixBase64, copyPaste: pixCopyPaste });
    }
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentId, status, pixBase64, pixCopyPaste);
    }
  };

  const handlePaymentError = (error: string) => {
    // Não fechamos, apenas deixamos o usuário ver o erro ou tentar novamente
  };

  const copyToClipboard = async () => {
    if (!pixData?.copyPaste) return;
    
    try {
      await navigator.clipboard.writeText(pixData.copyPaste);
      setHasCopied(true);
      toast.success("Código Pix copiado com sucesso!");
    } catch (err) {
      // Fallback para ambientes sem suporte a clipboard ou erro de permissão
      console.error("Failed to copy:", err);
      // Tentativa alternativa com elemento temporário
      const textArea = document.createElement("textarea");
      textArea.value = pixData.copyPaste;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setHasCopied(true);
        toast.success("Código Pix copiado com sucesso!");
      } catch (err2) {
        toast.error("Não foi possível copiar. Selecione o código manualmente.");
      }
      document.body.removeChild(textArea);
    }
    setTimeout(() => setHasCopied(false), 3000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95dvh] sm:h-[85dvh] rounded-t-3xl p-0 sm:max-w-[500px] sm:mx-auto flex flex-col">
        <SheetHeader className="p-6 pb-4 text-left bg-emerald-500/10 rounded-t-3xl shrink-0 relative">
          <SheetTitle className="text-2xl font-black pr-8">Pagamento</SheetTitle>
          <SheetDescription className="text-gray-600 font-medium">
            Escolha como prefere pagar sua comanda de{" "}
            <span className="font-bold text-gray-900">
              {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)}
            </span>
          </SheetDescription>
        </SheetHeader>
        
        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
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
              {pixData ? (
                <div className="flex flex-col items-center justify-center p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Escaneie ou Copie o QR Code</h3>
                  <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">
                    Para finalizar, abra o aplicativo do seu banco e pague o valor exato da comanda usando o código abaixo.
                  </p>
                  
                  <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <img 
                      src={`data:image/jpeg;base64,${pixData.base64}`} 
                      alt="QR Code Pix" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  
                  <div className="w-full space-y-4">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 overflow-hidden relative group">
                      <p className="text-xs text-gray-500 font-mono break-all line-clamp-2">
                        {pixData.copyPaste}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={copyToClipboard}
                      className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all ${
                        hasCopied 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20" 
                          : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                      }`}
                    >
                      {hasCopied ? (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Código Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-5 w-5" />
                          Copiar Código Pix
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

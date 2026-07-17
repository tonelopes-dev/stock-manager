"use client";

import { Button } from "@/app/_components/ui/button";
import { CheckCircle2, Copy, MessageCircle } from "lucide-react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";

interface PixPaymentDisplayProps {
  qrCodeBase64: string;
  copyPasteCode: string;
  totalAmount: number;
}

export function PixPaymentDisplay({ qrCodeBase64, copyPasteCode, totalAmount }: PixPaymentDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyPasteCode);
      } else {
        // Fallback para HTTP (ex: acessando localhost pelo celular via IP da rede)
        const textArea = document.createElement("textarea");
        textArea.value = copyPasteCode;
        // Evita rolar a página
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success("Código PIX copiado!");
    } catch (err) {
      console.error("Falha ao copiar:", err);
      toast.error("Não foi possível copiar automaticamente.");
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    // Para simplificar, o lojista precisaria digitar o número ou já ter do cliente.
    // O texto gerado:
    const text = encodeURIComponent(
      `Olá! Segue a chave PIX Copia e Cola para o pagamento da sua comanda de ${Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(totalAmount)}:\n\n${copyPasteCode}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in zoom-in-95 duration-300">
      <div className="text-center space-y-2">
        <h3 className="font-bold text-gray-900 text-lg">Pague com PIX</h3>
        <p className="text-sm text-gray-500 max-w-[250px]">
          Escaneie o QR Code abaixo ou copie o código para pagar no seu banco.
        </p>
      </div>

      {/* Se o Base64 vier do Mercado Pago, mostramos. Se vier quebrado, podemos gerar na hora usando qrcode.react com a chave copiaecola */}
      <div className="relative p-4 bg-white border-2 border-emerald-500/20 rounded-2xl">
        {qrCodeBase64 ? (
          <Image 
            src={`data:image/png;base64,${qrCodeBase64}`} 
            alt="PIX QR Code" 
            width={200} 
            height={200} 
            className="rounded-lg"
          />
        ) : (
          <QRCodeSVG value={copyPasteCode} size={200} />
        )}
      </div>

      <div className="w-full space-y-3">
        <Button 
          variant={copied ? "default" : "outline"}
          className={copied ? "w-full bg-emerald-500 hover:bg-emerald-600 transition-colors" : "w-full transition-colors"}
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Código PIX
            </>
          )}
        </Button>

        <Button 
          variant="secondary"
          className="w-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
          onClick={handleShareWhatsApp}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Enviar por WhatsApp
        </Button>
      </div>
    </div>
  );
}

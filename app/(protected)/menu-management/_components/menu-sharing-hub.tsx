"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Download,
  Copy,
  Check,
  QrCode,
  Share2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

interface MenuSharingHubProps {
  companyId: string;
}

export const MenuSharingHub = ({ companyId }: MenuSharingHubProps) => {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const baseUrl = `https://usekipo.com.br/menu/${companyId}`;
  const menuUrl = tableNumber ? `${baseUrl}?table=${tableNumber}` : baseUrl;

  useEffect(() => {
    if (qrModalOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, menuUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
      });
    }
  }, [qrModalOpen, menuUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qrcode-cardapio${tableNumber ? `-mesa-${tableNumber}` : ""}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("QR Code salvo!");
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `🍽️ Confira nosso Cardápio Digital!\n${menuUrl}`,
  )}`;

  return (
    <>
      <div className="rounded-2xl border border-border bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Share2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">
              Hub de Divulgação
            </h3>
            <p className="text-xs text-muted-foreground">
              Compartilhe seu cardápio digital com os clientes
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            onClick={() => setQrModalOpen(true)}
          >
            <QrCode className="h-4 w-4" />
            Ver QR Code
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copiado!" : "Copiar Link"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl text-green-700 hover:bg-green-50 hover:text-green-800"
            asChild
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            asChild
          >
            <a href={menuUrl} target="_blank" rel="noopener noreferrer">
              <Share2 className="h-4 w-4" />
              Abrir Cardápio
            </a>
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <code className="flex-1 truncate text-xs text-muted-foreground">
            {menuUrl}
          </code>
        </div>
      </div>

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              QR Code do Cardápio
            </DialogTitle>
            <DialogDescription>
              Imprima e cole nas mesas para acesso instantâneo
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-2xl border-2 border-dashed border-border p-4">
              <canvas ref={canvasRef} />
            </div>

            {/* Table Number (future-ready) */}
            <div className="w-full">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Nº da Mesa (opcional)
              </label>
              <Input
                placeholder="Ex: 01, 02..."
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="rounded-xl text-center"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Gera um QR Code exclusivo com ?table=XX para identificação
                automática
              </p>
            </div>

            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2 rounded-xl"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiado!" : "Copiar Link"}
              </Button>
              <Button
                className="flex-1 gap-2 rounded-xl"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Salvar PNG
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

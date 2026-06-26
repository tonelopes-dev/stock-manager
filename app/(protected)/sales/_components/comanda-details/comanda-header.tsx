"use client";

import { ComandaDto } from "@/app/_data-access/order/get-active-comandas";
import { Badge } from "@/app/_components/ui/badge";
import { ShoppingCart } from "lucide-react";
import {
  SheetHeader as UISheetHeader,
  SheetTitle as UISheetTitle,
  SheetDescription as UISheetDescription,
} from "@/app/_components/ui/sheet";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/app/_components/ui/dialog";
import Image from "next/image";
import { WhatsAppButton } from "@/app/_components/whatsapp-button";

interface ComandaHeaderProps {
  comanda: ComandaDto;
  isImageOpen: boolean;
  setIsImageOpen: (open: boolean) => void;
}

export const ComandaHeader = ({
  comanda,
  isImageOpen,
  setIsImageOpen,
}: ComandaHeaderProps) => {
  return (
    <UISheetHeader className="border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
            <DialogTrigger asChild>
              <div className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary shadow-sm transition-all hover:scale-110 active:scale-95">
                {comanda.customerImageUrl ? (
                  <Image
                    src={comanda.customerImageUrl}
                    alt={comanda.customerName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <ShoppingCart size={24} />
                )}
              </div>
            </DialogTrigger>
            {comanda.customerImageUrl && (
              <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-[500px]">
                <DialogTitle className="sr-only">Foto do Cliente: {comanda.customerName}</DialogTitle>
                <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
                  <Image
                    src={comanda.customerImageUrl}
                    alt={comanda.customerName}
                    fill
                    className="object-cover"
                  />
                </div>
              </DialogContent>
            )}
          </Dialog>
          <div className="flex flex-col text-left">
            <UISheetTitle className="line-clamp-1 pr-2 text-xl font-black uppercase italic leading-tight tracking-tighter text-foreground">
              {comanda.customerName}
            </UISheetTitle>
            <div className="flex items-center gap-2">
              <UISheetDescription className="text-xs font-bold text-muted-foreground">
                {comanda.customerPhone || "Sem telefone"}
              </UISheetDescription>
              {comanda.customerPhone && (
                <WhatsAppButton phoneNumber={comanda.customerPhone} />
              )}
            </div>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 border-none bg-emerald-50 text-[10px] font-black uppercase text-emerald-600"
        >
          Ativa
        </Badge>
      </div>
    </UISheetHeader>
  );
};

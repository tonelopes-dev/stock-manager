"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Tag, Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getPromotionsAction } from "@/app/_actions/menu/get-promotions";
import { useUIStore } from "../_store/use-ui-store";
import { isPromotionActive } from "@/app/_lib/promotion";

interface PromotionsModalProps {
  companySlug: string;
  onSelectProduct: (product: any) => void;
}

export function PromotionsModal({
  companySlug,
  onSelectProduct,
}: PromotionsModalProps) {
  const { isPromotionsModalOpen, closePromotionsModal } = useUIStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPromotionsModalOpen) {
      setLoading(true);
      getPromotionsAction(companySlug).then((res) => {
        if (res.success) {
          // Filter products with active promotion schedule
          const activePromotions = res.products.filter(p => isPromotionActive(p));
          setProducts(activePromotions);
        }
        setLoading(false);
      });
    }
  }, [isPromotionsModalOpen, companySlug]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <Dialog open={isPromotionsModalOpen} onOpenChange={(val) => !val && closePromotionsModal()}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Tag size={24} className="fill-primary/20" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight text-gray-900">
                Ofertas do Dia
              </DialogTitle>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
                Aproveite enquanto durar
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Tag className="h-12 w-12 text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold">Nenhuma promoção ativa agora.</p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="group relative overflow-hidden rounded-[2rem] bg-gray-50/50 p-4 transition-all active:scale-[0.98] border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40"
                onClick={() => {
                  onSelectProduct(product);
                  closePromotionsModal();
                }}
              >
                <div className="flex gap-4">
                  {product.imageUrl && (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-sm">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-center">
                    <h3 className="text-sm font-black text-gray-900 leading-tight">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-base font-black text-primary">
                        {formatPrice(product.promoPrice!)}
                      </span>
                      <span className="text-[10px] font-bold text-gray-300 line-through">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    {product.promoPrice && (
                      <div className="mt-1">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-black px-1.5 py-0.5 uppercase tracking-wider">
                          Economize {formatPrice(product.price - product.promoPrice)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Button
                      size="icon"
                      className="h-9 w-9 rounded-xl bg-gray-900 text-white shadow-lg"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <Button 
            variant="ghost" 
            className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400"
            onClick={() => closePromotionsModal()}
          >
            Fechar Ofertas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

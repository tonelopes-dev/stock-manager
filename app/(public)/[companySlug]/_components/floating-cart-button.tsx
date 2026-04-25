"use client";

import { useCartStore } from "../_store/use-cart-store";
import { ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { CartCheckoutSheet } from "@/app/(public)/[companySlug]/_components/cart-checkout-sheet";

interface FloatingCartButtonProps {
  companyId: string;
  requireSelfieOnCheckout?: boolean;
}

export function FloatingCartButton({ companyId, requireSelfieOnCheckout = false }: FloatingCartButtonProps) {
  const { totalItems, totalAmount } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Hydration fix for Zustand persist
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || totalItems === 0) return null;

  return (
    <>
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setIsSheetOpen(true)}
          data-testid="floating-cart-button"
          className="w-full bg-primary text-primary-foreground h-14 rounded-2xl shadow-2xl flex items-center justify-between px-6 active:scale-95 transition-transform ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
              {totalItems}
            </div>
            <span className="font-semibold uppercase tracking-wide text-sm">Ver Sacola</span>
          </div>

          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 opacity-70" />
            <span className="font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalAmount)}
            </span>
          </div>
        </button>
      </div>

      <CartCheckoutSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        companyId={companyId}
        requireSelfieOnCheckout={requireSelfieOnCheckout}
      />
    </>
  );
}

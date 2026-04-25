"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X, User, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/app/_components/ui/sheet";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { useCartStore, CartItem } from "../_store/use-cart-store";
import { createOrderAction } from "@/app/_actions/order/create-order";

interface CartCheckoutSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function CartCheckoutSheet({ isOpen, onOpenChange, companyId }: CartCheckoutSheetProps) {
  const router = useRouter();
  const params = useParams();
  const companySlug = params.companySlug as string;
  
  const { items, totalAmount, updateQuantity, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Identification state
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!customerName.trim()) {
      toast.error("Por favor, informe seu nome para continuar.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await createOrderAction({
        companyId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes
        })),
        tableNumber: tableNumber || undefined,
        notes: `Cliente: ${customerName}`,
      });

      if (result?.data?.success && result.data.orderId) {
        toast.success("Pedido realizado com sucesso!");
        clearCart();
        onOpenChange(false);
        router.push(`/${companySlug}/order/${result.data.orderId}`);
      } else {
        toast.error(result?.serverError || "Erro ao processar pedido. Tente novamente.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex h-[92vh] max-w-md flex-col rounded-t-[3rem] border-none p-0 shadow-2xl"
      >
        <SheetHeader className="px-8 pt-8">
          <SheetTitle className="flex items-center justify-between text-2xl font-black italic tracking-tighter text-foreground">
            SUA SACOLA
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-12 w-12 rounded-full bg-muted ring-2 ring-primary ring-offset-2 transition-all hover:bg-muted hover:ring-primary active:scale-95"
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 pt-2">
          {items.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-muted-foreground opacity-20" />
              </div>
              <p className="font-medium text-muted-foreground">
                Sua sacola está vazia.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6 py-4">
                {items.map((item: CartItem) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 duration-300 animate-in fade-in slide-in-from-right-4"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {item.name}
                      </h4>
                      {item.notes && (
                        <p className="text-[10px] italic text-muted-foreground line-clamp-1">
                          "{item.notes}"
                        </p>
                      )}
                      <p className="text-xs font-black text-primary mt-1">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-muted-foreground transition-colors hover:text-destructive"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isSubmitting}
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                      </Button>
                      <span className="w-6 text-center text-xs font-black text-foreground">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-muted-foreground transition-colors hover:text-primary"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isSubmitting}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Identification Form */}
              <div className="mt-8 space-y-6 rounded-[2rem] bg-gray-50 p-6 border border-gray-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Identificação</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 ml-1">
                      <User className="w-3 h-3" />
                      SEU NOME *
                    </label>
                    <Input 
                      placeholder="Como podemos te chamar?"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-12 rounded-xl border-none bg-white shadow-sm focus-visible:ring-primary/20"
                      disabled={isSubmitting}
                      data-testid="checkout-customer-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 ml-1">
                      <MapPin className="w-3 h-3" />
                      MESA (OPCIONAL)
                    </label>
                    <Input 
                      placeholder="Ex: 12"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="h-12 rounded-xl border-none bg-white shadow-sm focus-visible:ring-primary/20"
                      disabled={isSubmitting}
                      data-testid="checkout-table-number"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 px-8 pb-10 pt-6 border-t bg-background/80 backdrop-blur-md">
          <div className="flex flex-col gap-2 rounded-[2rem] border border-border bg-muted p-6">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>Subtotal</span>
              <span>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalAmount)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-lg font-black text-foreground">
              <span>Total</span>
              <span className="text-primary">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalAmount)}
              </span>
            </div>
          </div>

          <Button
            className="h-16 w-full rounded-[2rem] bg-foreground text-lg font-black text-background shadow-xl transition-all hover:bg-foreground active:scale-[0.98] disabled:opacity-50"
            disabled={items.length === 0 || isSubmitting}
            data-testid="checkout-submit-button"
            onClick={handleCheckout}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                PROCESSANDO...
              </div>
            ) : (
              "FINALIZAR PEDIDO"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

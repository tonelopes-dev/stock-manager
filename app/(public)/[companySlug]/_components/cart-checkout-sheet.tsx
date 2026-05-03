"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X, User, Phone, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { cn, formatPhoneNumber } from "@/app/_lib/utils";

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
import { SelfieCamera } from "./selfie-camera";
import { updateCustomerSelfie } from "@/app/_actions/customer/update-customer-selfie";

interface CartCheckoutSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  requireSelfieOnCheckout?: boolean;
  enableServiceTax?: boolean;
}

export function CartCheckoutSheet({ isOpen, onOpenChange, companyId, requireSelfieOnCheckout = false, enableServiceTax = true }: CartCheckoutSheetProps) {
  const router = useRouter();
  const params = useParams();
  const companySlug = params.companySlug as string;
  
  const { items, totalAmount, updateQuantity, clearCart, allowNegativeStock } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalDiscount = items.reduce((acc, item) => {
    if (item.basePrice && item.basePrice > item.price) {
      return acc + (item.basePrice - item.price) * item.quantity;
    }
    return acc;
  }, 0);

  const subtotalWithDiscounts = totalAmount + totalDiscount;
  
  // Identification state
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [customerExists, setCustomerExists] = useState(false);
  const [tempCustomerId, setTempCustomerId] = useState<string | null>(null);
  const [customerImageUrl, setCustomerImageUrl] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"DETAILS" | "SELFIE">("DETAILS");

  // Load saved customer from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedCustomer = localStorage.getItem(`kipo-customer-${companyId}`);
      if (savedCustomer) {
        try {
          const data = JSON.parse(savedCustomer);
          setCustomerName(data.name || "");
          setPhoneNumber(formatPhoneNumber(data.phoneNumber || ""));
          setIsPhoneVerified(true);
          setCustomerExists(true);
          setTempCustomerId(data.customerId || null);
          setCustomerImageUrl(data.imageUrl || null);
        } catch (e) {
          console.error("Error parsing saved customer");
        }
      }
      setCheckoutStep("DETAILS");
    }
  }, [isOpen, companyId]);

  const handleCheckPhone = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanPhone) {
      toast.error("Informe o telefone primeiro.");
      return;
    }
    
    setIsCheckingPhone(true);
    try {
      const res = await fetch(`/api/customers/check?phone=${cleanPhone}&companyId=${companyId}`);
      const data = await res.json();

      setIsPhoneVerified(true);
      if (data.exists) {
        setCustomerExists(true);
        setCustomerName(data.customer.name);
        setTempCustomerId(data.customer.customerId);
        setCustomerImageUrl(data.customer.imageUrl || null);
        
        // Salva os dados no localStorage para que o usuário não precise logar novamente na tela de pedidos
        localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify(data.customer));
        
        toast.success(`Olá, ${data.customer.name.split(' ')[0]}!`);
      } else {
        setCustomerExists(false);
        setCustomerName("");
        setTempCustomerId(null);
        setCustomerImageUrl(null);
        toast.info("Não encontramos seu cadastro. Por favor, informe seu nome.");
      }
    } catch {
      toast.error("Erro ao verificar telefone.");
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleSelfieCapture = async (blob: Blob) => {
    setIsSubmitting(true);
    try {
      // 1. Upload the image - following the pattern from estoque
      const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: "image/jpeg" });
      
      const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&category=customers&companySlug=${companySlug}&v=${Date.now()}`, {
        method: "POST",
        body: file,
      });
      
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      // 2. Update customer record
      if (tempCustomerId) {
        await updateCustomerSelfie(tempCustomerId, url);
        setCustomerImageUrl(url);
        
        // Update local storage
        const saved = localStorage.getItem(`kipo-customer-${companyId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify({ ...parsed, imageUrl: url }));
        }
      }

      toast.success("Selfie salva com sucesso!");
      setCheckoutStep("DETAILS");
      
      // Proceed to final checkout after a small delay
      setTimeout(() => handleCheckout(url), 500);
    } catch (error) {
      toast.error("Erro ao processar selfie.");
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async (forcedImageUrl?: string) => {
    if (items.length === 0) return;
    if (!isPhoneVerified) {
      toast.error("Por favor, verifique seu telefone primeiro.");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Por favor, informe seu nome completo.");
      return;
    }

    // Selfie Validation
    if (requireSelfieOnCheckout && !customerImageUrl && !forcedImageUrl && checkoutStep === "DETAILS") {
      setCheckoutStep("SELFIE");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let finalCustomerId = tempCustomerId;
      const cleanPhone = phoneNumber.replace(/\D/g, "");

      if (!customerExists || !finalCustomerId) {
        // Register new customer
        const regRes = await fetch("/api/customers/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: customerName, 
            phoneNumber: cleanPhone, 
            imageUrl: forcedImageUrl || customerImageUrl,
            companyId 
          }),
        });
        const regData = await regRes.json();
        
        if (regData.success) {
          finalCustomerId = regData.customer.customerId;
          localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify(regData.customer));
        } else {
          toast.error(regData.message || "Erro ao realizar cadastro.");
          setIsSubmitting(false);
          return;
        }
      }

      // 4. Create Order
      const result = await createOrderAction({
        companyId,
        customerId: finalCustomerId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes
        })),
        notes: `Cliente: ${customerName} | Tel: ${cleanPhone}`,
        hasServiceTax: enableServiceTax,
      });

      if (result?.data?.success && result.data.orderId) {
        toast.success("Pedido realizado com sucesso!");
        clearCart();
        onOpenChange(false);
        router.push(`/${companySlug}/my-orders`);
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

  const isCheckoutDisabled = items.length === 0 || isSubmitting || !isPhoneVerified || !customerName.trim();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        className="mx-auto flex h-[92vh] max-w-md flex-col rounded-t-[3rem] border-none p-0 shadow-2xl"
      >
        <SheetHeader className="px-8 pt-8">
          <SheetTitle className="flex items-center justify-between text-2xl font-black italic tracking-tighter text-foreground uppercase">
            {checkoutStep === "SELFIE" ? "Identificação" : "Sua Sacola"}
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
              {checkoutStep === "DETAILS" && (
                <div className="space-y-6 py-4">
                  {/* Identification Form */}
                  <div className="space-y-6 rounded-[2rem] bg-gray-50 p-6 border border-gray-100">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Identificação</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-500 ml-1">
                          <Phone className="w-3 h-3" />
                          TELEFONE (WHATSAPP) *
                        </label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="(00) 00000-0000"
                            value={phoneNumber}
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value);
                              setPhoneNumber(formatted);
                              setIsPhoneVerified(false);
                            }}
                            className="h-12 rounded-xl border-none bg-white shadow-sm focus-visible:ring-primary/20"
                            disabled={isSubmitting || isCheckingPhone}
                            type="tel"
                            data-testid="checkout-phone-number"
                          />
                          <Button
                            type="button"
                            onClick={handleCheckPhone}
                            disabled={isSubmitting || isCheckingPhone || !phoneNumber.trim()}
                            className={cn(
                              "h-12 w-12 shrink-0 rounded-xl transition-all",
                              isPhoneVerified 
                                ? "bg-emerald-500 hover:bg-emerald-600" 
                                : "bg-primary hover:bg-primary/90 text-white"
                            )}
                          >
                            {isCheckingPhone ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Check className="h-5 w-5" strokeWidth={3} />
                            )}
                          </Button>
                        </div>
                      </div>

                      {isPhoneVerified && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 ml-1">
                            <User className="w-3 h-3" />
                            NOME E SOBRENOME *
                          </label>
                          <Input 
                            placeholder="Como podemos te chamar?"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="h-12 rounded-xl border-none bg-white shadow-sm focus-visible:ring-primary/20"
                            disabled={isSubmitting || (isPhoneVerified && customerExists)}
                            data-testid="checkout-customer-name"
                          />
                          {customerExists && (
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => router.push(`/${companySlug}/profile`)}
                                className="text-[10px] font-bold text-primary hover:underline px-1"
                              >
                                Editar Perfil
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

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
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-black text-primary">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.price)}
                          </p>
                          {item.basePrice && item.basePrice > item.price && (
                            <span className="text-[10px] font-bold text-gray-400 line-through">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(item.basePrice)}
                            </span>
                          )}
                        </div>
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
                          onClick={() => {
                            const success = updateQuantity(item.id, item.quantity + 1);
                            if (!success) {
                              toast.error("Limite de estoque atingido!");
                            }
                          }}
                          disabled={isSubmitting || (!allowNegativeStock && item.quantity >= item.maxQuantity)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {checkoutStep === "SELFIE" && (
                <div className="mt-8 animate-in fade-in zoom-in-95 duration-500">
                  <SelfieCamera onCapture={handleSelfieCapture} />
                  <Button 
                    variant="ghost" 
                    onClick={() => setCheckoutStep("DETAILS")}
                    className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600"
                  >
                    Voltar para os dados
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {checkoutStep === "DETAILS" && (
          <div className="flex flex-col gap-4 px-8 pb-10 pt-6 border-t bg-background/80 backdrop-blur-md">
            <div className="flex flex-col gap-2 rounded-[2rem] border border-border bg-muted p-6">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span>Subtotal</span>
                <span>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(subtotalWithDiscounts)}
                </span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-emerald-600">
                  <span>Descontos</span>
                  <span>
                    -{new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalDiscount)}
                  </span>
                </div>
              )}
              
              {enableServiceTax && (
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground border-t border-dashed border-border/50 pt-2 mt-1">
                  <span>Taxa de Serviço (10%)</span>
                  <span>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalAmount * 0.1)}
                  </span>
                </div>
              )}

              <div className="mt-2 flex items-center justify-between text-lg font-black text-foreground pt-2 border-t border-border/50">
                <span>Total</span>
                <span className="text-primary">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(enableServiceTax ? totalAmount * 1.1 : totalAmount)}
                </span>
              </div>
            </div>

            <Button
              className={cn(
                "h-16 w-full rounded-[2rem] text-lg font-black italic tracking-tighter shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale",
                isCheckoutDisabled ? "bg-muted text-muted-foreground" : "bg-primary text-white"
              )}
              disabled={isCheckoutDisabled}
              data-testid="checkout-submit-button"
              onClick={() => handleCheckout()}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  "PROCESSANDO..."
                </div>
              ) : (
                "FINALIZAR PEDIDO"
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

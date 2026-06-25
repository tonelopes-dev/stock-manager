"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
  User,
  Phone,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/_lib/utils";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/app/_components/ui/sheet";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { useCartStore, CartItem } from "../../_store/use-cart-store";
import { createOrderAction } from "@/app/_actions/order/create-order";
import { SelfieCamera } from "../checkout/selfie-camera";
import { PatternFormat, NumberFormatValues } from "react-number-format";
import { useMenuConfig } from "../../_context/menu-config-context";
import { useCustomerSession } from "../../_hooks/use-customer-session";
import { useSelfieUpload } from "../../_hooks/use-selfie-upload";

interface CartCheckoutSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function CartCheckoutSheet({
  isOpen,
  onOpenChange,
  companyId,
}: CartCheckoutSheetProps) {
  const { requireSelfieOnCheckout, enableServiceTax } = useMenuConfig();
  const router = useRouter();
  const params = useParams();
  const companySlug = params.companySlug as string;

  const { items, totalAmount, updateQuantity, clearCart, allowNegativeStock } =
    useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"DETAILS" | "SELFIE">(
    "DETAILS",
  );
  const {
    customerName,
    setCustomerName,
    phoneNumber,
    setPhoneNumber,
    isPhoneVerified,
    setIsPhoneVerified,
    isCheckingPhone,
    customerExists,
    tempCustomerId,
    customerImageUrl,
    setCustomerImageUrl,
    loadFromStorage,
    handleCheckPhone,
    setSessionData,
  } = useCustomerSession(companyId);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus phone input when sheet opens and user is not identified
  useEffect(() => {
    if (isOpen && (!isPhoneVerified || !customerExists)) {
      const timer = setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isPhoneVerified, customerExists]);

  // Auto-focus name input when registration mode is activated
  useEffect(() => {
    if (isPhoneVerified && !customerExists && !customerName) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPhoneVerified, customerExists, customerName]);

  const [isRegistering, setIsRegistering] = useState(false);

  const handleResetPhoneVerification = () => {
    setIsPhoneVerified(false);
  };

  const handleRegisterAndLogin = async () => {
    if (!customerName.trim()) {
      toast.error("Por favor, informe seu nome completo.");
      return;
    }

    setIsRegistering(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const regRes = await fetch("/api/customers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customerName,
          phoneNumber: cleanPhone,
          companyId,
        }),
      });
      const regData = await regRes.json();

      if (regData.success) {
        setSessionData(regData.customer);
        toast.success(
          `Cadastro realizado! Olá, ${customerName.split(" ")[0]}!`,
        );
      } else {
        toast.error(regData.message || "Erro ao realizar cadastro.");
      }
    } catch (error) {
      toast.error("Erro inesperado ao realizar cadastro.");
      console.error(error);
    } finally {
      setIsRegistering(false);
    }
  };

  // Load saved customer from localStorage when sheet opens
  useEffect(() => {
    if (isOpen) {
      loadFromStorage();
      setCheckoutStep("DETAILS");
    }
  }, [isOpen, loadFromStorage]);

  const { isUploading, handleSelfieCapture } = useSelfieUpload({
    companyId,
    companySlug,
    tempCustomerId,
    onUploadSuccess: (url) => {
      setCustomerImageUrl(url);
      setCheckoutStep("DETAILS");
      setTimeout(() => handleCheckout(url), 500);
    },
  });

  const isSubmittingOrUploading = isSubmitting || isUploading;

  const totalDiscount = items.reduce((acc, item) => {
    if (item.basePrice && item.basePrice > item.price) {
      return acc + (item.basePrice - item.price) * item.quantity;
    }
    return acc;
  }, 0);

  const subtotalWithDiscounts = totalAmount + totalDiscount;

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
    if (
      requireSelfieOnCheckout &&
      !customerImageUrl &&
      !forcedImageUrl &&
      checkoutStep === "DETAILS"
    ) {
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
            companyId,
          }),
        });
        const regData = await regRes.json();

        if (regData.success) {
          finalCustomerId = regData.customer.customerId;
          setSessionData(regData.customer);
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
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes,
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
        toast.error(
          result?.serverError || "Erro ao processar pedido. Tente novamente.",
        );
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCheckoutDisabled =
    items.length === 0 ||
    isSubmittingOrUploading ||
    !isPhoneVerified ||
    !customerName.trim();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        className="mx-auto flex h-[87vh] max-w-md flex-col rounded-t-[3rem] border-none p-0 shadow-2xl"
      >
        <SheetHeader className="px-6 pt-6">
          {isPhoneVerified &&
            customerExists &&
            customerName &&
            checkoutStep === "DETAILS" && (
              <div className="mb-3 flex items-center gap-2 duration-300 animate-in fade-in slide-in-from-top-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                  {customerImageUrl ? (
                    <Image
                      src={customerImageUrl}
                      alt={customerName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-black uppercase text-primary">
                      {customerName.substring(0, 2)}
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">
                    Cliente Identificado
                  </span>
                  <span className="max-w-[180px] truncate text-sm font-black leading-tight text-gray-900">
                    {customerName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/${companySlug}/profile`);
                  }}
                  className="ml-auto rounded-lg bg-primary/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-primary transition-colors hover:underline"
                >
                  Editar
                </button>
              </div>
            )}
          <SheetTitle className="flex items-center justify-between text-2xl font-black uppercase italic tracking-tighter text-foreground">
            {checkoutStep === "SELFIE" ? "Identificação" : "Sua Sacola"}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 rounded-full bg-muted ring-2 ring-primary ring-offset-2 transition-all hover:bg-muted hover:ring-primary active:scale-95"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pt-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ShoppingBag className="h-8 w-8 text-muted-foreground opacity-20" />
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
                  {(!isPhoneVerified || !customerExists) && (
                    <div className="space-y-6 rounded-[2rem] border border-gray-100 bg-gray-50 p-6">
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                        Identificação
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="ml-1 flex items-center gap-2 text-xs font-bold text-gray-500">
                            <Phone className="h-3 w-3" />
                            TELEFONE (WHATSAPP) *
                          </label>
                          <div className="flex gap-2">
                            <PatternFormat
                              format="(##) #####-####"
                              mask="_"
                              customInput={Input}
                              placeholder="(00) 00000-0000"
                              value={phoneNumber}
                              onValueChange={(values: NumberFormatValues) => {
                                setPhoneNumber(values.value);
                                setIsPhoneVerified(false);
                              }}
                              className="h-12 rounded-xl border-none bg-white text-base shadow-sm focus-visible:ring-primary/20 md:text-sm"
                              disabled={
                                isSubmittingOrUploading ||
                                isCheckingPhone ||
                                isPhoneVerified
                              }
                              type="tel"
                              data-testid="checkout-phone-number"
                              getInputRef={phoneInputRef}
                            />
                            <Button
                              type="button"
                              onClick={
                                isPhoneVerified
                                  ? handleResetPhoneVerification
                                  : handleCheckPhone
                              }
                              disabled={
                                isSubmittingOrUploading ||
                                isCheckingPhone ||
                                (!isPhoneVerified && !phoneNumber.trim())
                              }
                              className={cn(
                                "h-12 w-12 shrink-0 rounded-xl transition-all",
                                isPhoneVerified
                                  ? "bg-rose-500 text-white hover:bg-rose-600"
                                  : "bg-primary text-white hover:bg-primary/90",
                              )}
                            >
                              {isCheckingPhone ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : isPhoneVerified ? (
                                <X className="h-5 w-5" strokeWidth={3} />
                              ) : (
                                <Check className="h-5 w-5" strokeWidth={3} />
                              )}
                            </Button>
                          </div>
                        </div>

                        {isPhoneVerified && (
                          <div className="space-y-2 duration-300 animate-in fade-in slide-in-from-top-2">
                            <label className="ml-1 flex items-center gap-2 text-xs font-bold text-gray-500">
                              <User className="h-3 w-3" />
                              NOME E SOBRENOME *
                            </label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Como podemos te chamar?"
                                value={customerName}
                                onChange={(e) =>
                                  setCustomerName(e.target.value)
                                }
                                className={cn(
                                  "h-12 rounded-xl border bg-white text-base shadow-sm transition-all md:text-sm",
                                  !customerName.trim()
                                    ? "border-rose-500 focus-visible:ring-rose-500/20"
                                    : "border-transparent focus-visible:ring-primary/20",
                                )}
                                disabled={
                                  isSubmittingOrUploading ||
                                  isRegistering ||
                                  (isPhoneVerified && customerExists)
                                }
                                data-testid="checkout-customer-name"
                                ref={nameInputRef}
                                type="text"
                                inputMode="text"
                                autoComplete="name"
                                autoCapitalize="words"
                              />
                              <Button
                                type="button"
                                onClick={handleRegisterAndLogin}
                                disabled={
                                  isSubmittingOrUploading ||
                                  isRegistering ||
                                  !customerName.trim()
                                }
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary/90"
                              >
                                {isRegistering ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Check className="h-5 w-5" strokeWidth={3} />
                                )}
                              </Button>
                            </div>
                            {customerExists && (
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onOpenChange(false);
                                    router.push(`/${companySlug}/profile`);
                                  }}
                                  className="px-1 text-[10px] font-bold text-primary hover:underline"
                                >
                                  Editar Perfil
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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

                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-foreground">
                          {item.name}
                        </h4>
                        {item.notes && (
                          <p className="line-clamp-1 text-[10px] italic text-muted-foreground">
                            "{item.notes}"
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
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
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={isSubmittingOrUploading}
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
                            const success = updateQuantity(
                              item.id,
                              item.quantity + 1,
                            );
                            if (!success) {
                              toast.error("Limite de estoque atingido!");
                            }
                          }}
                          disabled={
                            isSubmittingOrUploading ||
                            (!allowNegativeStock &&
                              item.quantity >= item.maxQuantity)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {checkoutStep === "SELFIE" && (
                <div className="mt-8 duration-500 animate-in fade-in zoom-in-95">
                  <SelfieCamera onCapture={handleSelfieCapture} />
                  <Button
                    variant="ghost"
                    onClick={() => setCheckoutStep("DETAILS")}
                    className="mt-4 w-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600"
                  >
                    Voltar para os dados
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {checkoutStep === "DETAILS" && isPhoneVerified && customerExists && (
          <div className="flex flex-col gap-3 border-t bg-background/80 px-6 pb-6 pt-4 backdrop-blur-md">
            <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-muted p-4">
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
                    -
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalDiscount)}
                  </span>
                </div>
              )}

              {enableServiceTax && (
                <div className="mt-1 flex items-center justify-between border-t border-dashed border-border/50 pt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Taxa de Serviço (10%)</span>
                  <span>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalAmount * 0.1)}
                  </span>
                </div>
              )}

              <div className="mt-1.5 flex items-center justify-between border-t border-border/50 pt-1.5 text-base font-black text-foreground">
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
                "h-14 w-full rounded-2xl text-base font-black italic tracking-tighter shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale",
                isCheckoutDisabled
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-white",
              )}
              disabled={isCheckoutDisabled}
              data-testid="checkout-submit-button"
              onClick={() => handleCheckout()}
            >
              {isSubmittingOrUploading ? (
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

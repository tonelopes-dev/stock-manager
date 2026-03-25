"use client";

import {
  MenuDataDto,
  MenuProductDto,
} from "@/app/_data-access/menu/get-menu-data";
import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { Card } from "@/app/_components/ui/card";
import {
  ShoppingBag,
  Search,
  Utensils,
  X,
  Plus,
  Minus,
  User,
  LogOut,
  Phone,
  Mail,
  Calendar,
  Loader2,
} from "lucide-react";
import { Input } from "@/app/_components/ui/input";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/app/_components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/_components/ui/dialog";
import { toast } from "sonner";
import { createOrderAction } from "@/app/_actions/order/create-order";
import { identifyCustomerAction } from "@/app/_actions/order/identify-customer";
import { checkCustomerPhoneAction } from "@/app/_actions/order/identify-customer/check-phone";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { format, parseISO } from "date-fns";

interface MenuClientProps {
  menuData: MenuDataDto;
  companyId: string;
}

interface CartItem extends MenuProductDto {
  quantity: number;
}

interface CustomerInfo {
  customerId: string;
  name: string;
  phoneNumber: string;
}

const STORAGE_KEY = (companyId: string) => `kipo-customer-${companyId}`;

export const MenuClient = ({ menuData, companyId }: MenuClientProps) => {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    menuData.categories[0]?.id || "",
  );
  const [search, setSearch] = useState("");
  // Cart & Order
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer identification
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [showIdentifyDialog, setShowIdentifyDialog] = useState(false);
  const [identifyStep, setIdentifyStep] = useState<"PHONE" | "DETAILS">(
    "PHONE",
  );
  const [identifyForm, setIdentifyForm] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    birthDate: "",
  });
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Load customer and activeOrderIds from LocalStorage
  useEffect(() => {
    const savedCustomer = localStorage.getItem(STORAGE_KEY(companyId));
    if (savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch {
        /* ignore */
      }
    }
  }, [companyId]);

  // Load cart from LocalStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`kipo-cart-${companyId}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        /* ignore */
      }
    }
  }, [companyId]);

  // Save cart to LocalStorage
  useEffect(() => {
    localStorage.setItem(`kipo-cart-${companyId}`, JSON.stringify(cart));
  }, [cart, companyId]);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY(companyId));
    setCustomer(null);
    toast.success(
      "Sessão encerrada. Identifique-se para fazer um novo pedido.",
    );
  };

  const addToCart = (product: MenuProductDto) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado!`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const filteredCategories = useMemo(() => {
    return menuData.categories
      .map((cat) => ({
        ...cat,
        products: cat.products.filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase()),
        ),
      }))
      .filter((cat) => cat.products.length > 0);
  }, [menuData, search]);

  const formatPrice = (price: number) =>
    Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      price,
    );

  const handleIdentifyPhone = async () => {
    if (!identifyForm.phoneNumber) {
      toast.error("Telefone é obrigatório.");
      return;
    }

    setIsIdentifying(true);
    try {
      const result = await checkCustomerPhoneAction({
        companyId,
        phoneNumber: identifyForm.phoneNumber,
      });

      if (result?.data?.found && result.data.customerId) {
        const customerInfo: CustomerInfo = {
          customerId: result.data.customerId,
          name: result.data.name,
          phoneNumber: identifyForm.phoneNumber,
        };
        setCustomer(customerInfo);
        localStorage.setItem(
          STORAGE_KEY(companyId),
          JSON.stringify(customerInfo),
        );
        setShowIdentifyDialog(false);
        toast.success(`Bem-vindo de volta, ${result.data.name}! 🎉`);

        // Directly submit order
        await submitOrder(result.data.customerId);
      } else {
        // Not found, go to details step
        setIdentifyStep("DETAILS");
      }
    } catch {
      toast.error("Erro ao verificar telefone.");
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleRegister = async () => {
    if (!identifyForm.name || !identifyForm.phoneNumber) {
      toast.error("Nome e telefone são obrigatórios.");
      return;
    }

    setIsIdentifying(true);
    try {
      const result = await identifyCustomerAction({
        companyId,
        name: identifyForm.name,
        phoneNumber: identifyForm.phoneNumber,
        email: identifyForm.email || undefined,
        birthDate: identifyForm.birthDate || undefined,
      });

      if (result?.data?.customerId) {
        const customerInfo: CustomerInfo = {
          customerId: result.data.customerId,
          name: result.data.customerName,
          phoneNumber: identifyForm.phoneNumber,
        };
        setCustomer(customerInfo);
        localStorage.setItem(
          STORAGE_KEY(companyId),
          JSON.stringify(customerInfo),
        );
        setShowIdentifyDialog(false);
        toast.success(
          `Cadastro realizado! Bem-vindo, ${result.data.customerName}! 🎉`,
        );

        await submitOrder(result.data.customerId);
      } else {
        toast.error("Erro ao realizar cadastro.");
      }
    } catch {
      toast.error("Erro ao processar identificação.");
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleIdentify = () => {
    if (identifyStep === "PHONE") {
      handleIdentifyPhone();
    } else {
      handleRegister();
    }
  };

  const submitOrder = async (customerId: string) => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await createOrderAction({
        companyId,
        customerId,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        notes: `Pedido via Cardápio Digital`,
      });

      if (result?.data?.success && result.data.orderId) {
        toast.success("Pedido enviado com sucesso! 🎉");
        setCart([]);
        localStorage.removeItem(`kipo-cart-${companyId}`);

        setIsCartOpen(false);
        router.push(`/menu/${companyId}/my-orders`);
      } else {
        toast.error(result?.serverError || "Erro ao enviar pedido");
      }
    } catch {
      toast.error("Erro inesperado ao enviar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!customer) {
      // Show identification dialog
      setShowIdentifyDialog(true);
      return;
    }

    // Already identified — submit directly
    await submitOrder(customer.customerId);
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-background font-sans shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border bg-background/90 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic leading-none tracking-tighter text-foreground">
              {menuData.companyName.toUpperCase()}
            </h1>
            <Badge
              variant="outline"
              className="mt-1 w-fit border-primary bg-primary/30 text-[10px] font-bold uppercase text-primary"
            >
              Cardápio Digital
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {customer && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5">
                  <User className="h-3.5 w-3.5 text-green-600" />
                  <span className="max-w-[80px] truncate text-xs font-bold text-green-700">
                    {customer.name.split(" ")[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Trocar de conta"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {customer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/menu/${companyId}/my-orders`)}
                className="flex h-10 items-center gap-2 rounded-2xl border-primary bg-primary/30 px-4 text-[10px] font-black uppercase text-primary shadow-sm transition-all hover:bg-primary"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Meus Pedidos</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-12 w-12 rounded-full border border-border bg-muted text-foreground"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-primary px-1 text-[10px] font-black text-background">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="O que você quer comer hoje?"
            className="h-12 rounded-2xl border-none bg-muted/50 pl-11 shadow-inner focus-visible:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categories Bar */}
        <div className="scrollbar-hide -mx-2 flex items-center gap-2 overflow-x-auto px-2 py-2">
          {menuData.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-5 py-2.5 transition-all duration-300 ${
                selectedCategoryId === category.id
                  ? "bg-foreground text-background shadow-xl shadow-slate-200"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="text-sm font-bold tracking-tight">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Product List */}
      <main className="flex-1 space-y-10 overflow-y-auto bg-background px-6 py-6 pb-28">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Utensils className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Nenhum prato encontrado
            </h3>
            <p className="mt-2 max-w-[200px] text-sm text-muted-foreground">
              Dica: Tente buscar por nomes genéricos ou verifique as categorias.
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section
              key={category.id}
              className="space-y-5 duration-500 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-xl font-black tracking-tighter text-foreground">
                  <span className="h-6 w-1.5 rounded-full bg-primary" />
                  {category.name}
                </h2>
                <Badge
                  variant="outline"
                  className="border-none font-bold text-muted-foreground"
                >
                  {category.products.length}
                </Badge>
              </div>
              <div className="grid gap-6">
                {category.products.map((product) => (
                  <div
                    key={product.id}
                    className="group relative cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <Card className="overflow-hidden rounded-[2.5rem] border-none bg-muted/40 transition-all duration-500 hover:bg-background hover:shadow-2xl hover:shadow-slate-100 active:scale-95">
                      <div className="flex gap-5 p-4">
                        {product.imageUrl ? (
                          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl shadow-lg">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {product.isPromotion && (
                              <div className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-1 text-[8px] font-black uppercase tracking-widest text-background shadow-lg">
                                Promo
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-background shadow-lg">
                            <Utensils className="h-10 w-10 text-muted-foreground" />
                            {product.isPromotion && (
                              <div className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-1 text-[8px] font-black uppercase tracking-widest text-background shadow-lg">
                                Promo
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex flex-1 flex-col justify-between py-1">
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                              {product.name}
                            </h3>
                            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {product.description ||
                                "Ingredientes selecionados para uma experiência gastronômica única."}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="rounded-full bg-primary px-3 py-1">
                              <span className="text-sm font-black text-primary">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg shadow-slate-200 transition-all group-hover:bg-primary">
                              <Plus className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <footer className="fixed bottom-8 left-1/2 z-30 w-[calc(100%-48px)] max-w-[calc(448px-48px)] -translate-x-1/2 duration-500 animate-in slide-in-from-bottom-6">
          <Button
            onClick={() => setIsCartOpen(true)}
            className="flex h-16 w-full items-center justify-between rounded-[2rem] border-t border-white/10 bg-foreground px-8 text-background shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all hover:bg-foreground active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background/10 backdrop-blur-sm">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Ver Sacola
                </span>
                <span className="text-sm font-bold">
                  {totalItems} {totalItems === 1 ? "item" : "itens"}
                </span>
              </div>
            </div>
            <span className="text-lg font-black">
              {formatPrice(totalPrice)}
            </span>
          </Button>
        </footer>
      )}

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto h-[90vh] max-w-md rounded-t-[3rem] border-none shadow-2xl"
        >
          <SheetHeader className="px-8 pt-8">
            <SheetTitle className="flex items-center justify-between text-2xl font-black italic tracking-tighter text-foreground">
              SUA SACOLA
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>

          <main className="max-h-[60vh] space-y-6 overflow-y-auto px-8 pt-2">
            {cart.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-medium text-muted-foreground">
                  Sua sacola está vazia.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 duration-300 animate-in fade-in slide-in-from-right-4"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm font-bold text-foreground">
                      {item.name}
                    </h4>
                    <p className="text-xs font-black text-primary">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl text-muted-foreground transition-colors hover:text-destructive"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-xs font-black text-foreground">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl text-muted-foreground transition-colors hover:text-primary"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </main>

          <SheetFooter className="space-y-4 px-8 pb-10 pt-6">
            <div className="flex flex-col gap-2 rounded-[2rem] border border-border bg-muted p-6">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-lg font-black text-foreground">
                <span>Total</span>
                <span className="text-primary">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {customer && (
              <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-2.5">
                <User className="h-4 w-4 text-green-600" />
                <span className="flex-1 text-xs font-bold text-green-700">
                  Pedido em nome de {customer.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-[10px] font-bold text-green-500 underline"
                >
                  Trocar
                </button>
              </div>
            )}

            <Button
              className="h-16 w-full rounded-[2rem] bg-foreground text-lg font-black text-background shadow-xl shadow-slate-200 transition-all hover:bg-foreground disabled:opacity-50"
              disabled={cart.length === 0 || isSubmitting}
              onClick={handleCheckout}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  ENVIANDO...
                </div>
              ) : (
                "FINALIZAR PEDIDO"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Customer Identification Dialog */}
      <Dialog
        open={showIdentifyDialog}
        onOpenChange={(open) => {
          setShowIdentifyDialog(open);
          if (!open) setIdentifyStep("PHONE"); // Reset step on close
        }}
      >
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
              <User className="h-5 w-5 text-primary" />
              {identifyStep === "PHONE"
                ? "Identificação"
                : "Complete seu cadastro"}
            </DialogTitle>
            <DialogDescription>
              {identifyStep === "PHONE"
                ? "Informe seu telefone para continuar."
                : "Parece que é sua primeira vez aqui! Conte-nos quem você é."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {identifyStep === "PHONE" ? (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  Telefone *
                </label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={identifyForm.phoneNumber}
                  onChange={(e) =>
                    setIdentifyForm({
                      ...identifyForm,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="rounded-xl"
                  type="tel"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <User className="h-3 w-3" />
                    Nome *
                  </label>
                  <Input
                    placeholder="Seu nome completo"
                    value={identifyForm.name}
                    onChange={(e) =>
                      setIdentifyForm({ ...identifyForm, name: e.target.value })
                    }
                    className="rounded-xl"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5 opacity-60">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    Telefone
                  </label>
                  <Input
                    value={identifyForm.phoneNumber}
                    disabled
                    className="rounded-xl bg-muted"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    Email <span className="text-muted-foreground">(opcional)</span>
                  </label>
                  <Input
                    placeholder="seu@email.com"
                    value={identifyForm.email}
                    onChange={(e) =>
                      setIdentifyForm({
                        ...identifyForm,
                        email: e.target.value,
                      })
                    }
                    className="rounded-xl"
                    type="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Data de nascimento{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </label>
                  <DatePicker
                    value={identifyForm.birthDate ? parseISO(identifyForm.birthDate) : undefined}
                    onChange={(date) =>
                      setIdentifyForm({
                        ...identifyForm,
                        birthDate: date ? format(date, "yyyy-MM-dd") : "",
                      })
                    }
                    showDropdowns={true}
                    className="rounded-xl"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="h-14 w-full rounded-2xl bg-foreground text-base font-black text-background shadow-xl transition-all hover:bg-foreground disabled:opacity-50"
              disabled={
                isIdentifying ||
                (identifyStep === "PHONE" && !identifyForm.phoneNumber) ||
                (identifyStep === "DETAILS" &&
                  (!identifyForm.name || !identifyForm.phoneNumber))
              }
              onClick={handleIdentify}
            >
              {isIdentifying ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {identifyStep === "PHONE"
                    ? "Verificando..."
                    : "Cadastrando..."}
                </div>
              ) : identifyStep === "PHONE" ? (
                "CONTINUAR"
              ) : (
                "CONFIRMAR E ENVIAR PEDIDO"
              )}
            </Button>

            {identifyStep === "DETAILS" && (
              <button
                onClick={() => setIdentifyStep("PHONE")}
                className="mt-2 text-center text-xs font-bold text-muted-foreground hover:text-muted-foreground"
              >
                Voltar e alterar telefone
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

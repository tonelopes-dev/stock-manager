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
  Pencil,
  MapPin,
  ChevronRight,
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
import { Textarea } from "@/app/_components/ui/textarea";
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
import { useRouter, useSearchParams } from "next/navigation";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { format, parseISO } from "date-fns";

interface MenuClientProps {
  menuData: MenuDataDto;
  companyId: string;
}

interface CartItem extends MenuProductDto {
  quantity: number;
  notes?: string;
}

interface CustomerInfo {
  customerId: string;
  name: string;
  phoneNumber: string;
}

const STORAGE_KEY = (companyId: string) => `kipo-customer-${companyId}`;
const TABLE_STORAGE_KEY = (companyId: string) => `kipo-table-${companyId}`;

export const MenuClient = ({ menuData, companyId }: MenuClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    menuData.categories[0]?.id || "",
  );
  const [search, setSearch] = useState("");
  // Cart & Order
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableNumber, setTableNumber] = useState<string | null>(null);

  // New UI states
  const [selectedProduct, setSelectedProduct] = useState<MenuProductDto | null>(null);
  const [detailsQuantity, setDetailsQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null);

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

  // Table handling (QR Code Capture)
  useEffect(() => {
    const tableFromUrl = searchParams.get("table");
    if (tableFromUrl) {
      setTableNumber(tableFromUrl);
      localStorage.setItem(TABLE_STORAGE_KEY(companyId), tableFromUrl);
    } else {
      const savedTable = localStorage.getItem(TABLE_STORAGE_KEY(companyId));
      if (savedTable) {
        setTableNumber(savedTable);
      }
    }
  }, [searchParams, companyId]);

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

  // Scroll Spy for sticky header
  useEffect(() => {
    const handleScroll = () => {
      // Performance log for scroll (sampled)
      if (Math.random() > 0.95) {
        console.log("[UI-LOG] Scroll performance check: Page offset", window.scrollY);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY(companyId));
    setCustomer(null);
    toast.success(
      "Sessão encerrada. Identifique-se para fazer um novo pedido.",
    );
  };

  const handleAddToCart = (product: MenuProductDto, quantity: number, notes?: string) => {
    setCart((prev) => {
      if (editingCartItemIndex !== null) {
        const newCart = [...prev];
        newCart[editingCartItemIndex] = { ...product, quantity, notes };
        return newCart;
      }

      const existing = prev.find((item) => item.id === product.id && item.notes === notes);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.notes === notes
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { ...product, quantity, notes }];
    });
    toast.success(editingCartItemIndex !== null ? "Item atualizado!" : `${product.name} adicionado!`);
    setSelectedProduct(null);
    setDetailsQuantity(1);
    setItemNotes("");
    setEditingCartItemIndex(null);
  };

  const handleEditCartItem = (index: number) => {
    const item = cart[index];
    setSelectedProduct(item);
    setDetailsQuantity(item.quantity);
    setItemNotes(item.notes || "");
    setEditingCartItemIndex(index);
    setIsCartOpen(false);
    console.log(`[UI-LOG] Editing cart item at index: ${index}`);
  };

  const updateQuantity = (productId: string, notes: string | undefined, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId && item.notes === notes) {
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

  const highlights = useMemo(() => {
    return menuData.categories.flatMap(cat => cat.products).filter(p => p.isPromotion);
  }, [menuData]);

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

  const scrollToCategory = (categoryId: string) => {
    console.log(`[UI-LOG] Scrolling to category: ${categoryId}`);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const offset = 140; // Sticky header + Category nav height
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setSelectedCategoryId(categoryId);
  };

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
          notes: item.notes,
        })),
        tableNumber: tableNumber || undefined,
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
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-white font-sans shadow-2xl">
      {/* 1. Header with Banner & Avatar */}
      <header className="relative w-full">
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src="/restaurant_banner_bg_1776862657537.png"
            alt="Banner Loja"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Top Actions Over Banner */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/20 text-white backdrop-blur-md"
              onClick={() => router.back()}
            >
              <Utensils className="h-5 w-5" />
            </Button>
            <div className="flex gap-2">
              {customer && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white/20 text-white backdrop-blur-md"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-full bg-white/20 text-white backdrop-blur-md"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-[8px] font-black">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 1.2 Floating Store Info Card */}
        <div className="relative z-10 -mt-10 mx-6 rounded-[2.5rem] bg-white p-6 shadow-2xl shadow-gray-200/50">
          <div className="absolute -top-14 left-1/2 h-28 w-28 -translate-x-1/2 overflow-hidden rounded-full border-[6px] border-white bg-white shadow-xl">
            <Image
              src="/restaurant_logo_avatar_1776862675336.png"
              alt="Logo"
              fill
              className="object-cover"
            />
          </div>
          
          <div className="mt-14 flex flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              {menuData.companyName}
            </h1>
            
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span>Parnamirim - RN</span>
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <button className="font-bold text-gray-700 hover:text-primary transition-colors">
                  Mais informações
                </button>
              </div>

              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-black text-rose-500">
                  Fechado • Abrimos às 11h00
                </p>
                {tableNumber && (
                  <Badge variant="secondary" className="mt-1 bg-gray-900 px-3 py-1 text-[10px] font-black text-white rounded-full">
                    Mesa {tableNumber}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 1.3 Search Input */}
        <div className="relative mt-8 px-6">
          <Search className="absolute left-10 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="O que você quer comer hoje?"
            className="h-14 rounded-2xl border-none bg-gray-100 pl-12 text-sm shadow-inner focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* 2. Highlights Section (isPromotion) */}
      {highlights.length > 0 && (
        <section className="py-6">
          <div className="flex items-center justify-between px-6 pb-4">
            <h2 className="text-lg font-black tracking-tight">Destaques da Casa</h2>
            <Badge variant="outline" className="text-[10px] font-bold text-primary border-none bg-transparent">Ver todos</Badge>
          </div>
          <div className="flex gap-4 overflow-x-auto snap-x px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {highlights.map((product) => (
              <div 
                key={product.id} 
                className="w-72 shrink-0 snap-start"
                onClick={() => {
                  console.log(`[UI-LOG] Opening detail modal for: ${product.name}`);
                  setSelectedProduct(product);
                  setDetailsQuantity(1);
                  setItemNotes("");
                  setEditingCartItemIndex(null);
                }}
              >
                <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-muted shadow-sm">
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm font-bold text-white line-clamp-1">{product.name}</p>
                    <p className="text-xs font-black text-primary">{formatPrice(product.price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Sticky Category Nav */}
      <nav className="sticky top-0 z-30 border-b border-gray-50 bg-white/95 px-2 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {menuData.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => scrollToCategory(category.id)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-xs font-bold transition-all ${
                selectedCategoryId === category.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </nav>

      {/* 4. Product List (Refined Cards) */}
      <main className="flex-1 space-y-10 px-6 py-8 pb-32">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Utensils className="h-12 w-12 text-gray-200" />
            <h3 className="mt-4 text-lg font-bold">Nada encontrado</h3>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section key={category.id} id={`category-${category.id}`} className="scroll-mt-32 space-y-6">
              <h2 className="text-xl font-black tracking-tight text-gray-900">{category.name}</h2>
              <div className="grid gap-6">
                {category.products.map((product) => (
                  <div
                    key={product.id}
                    className="group relative flex cursor-pointer gap-4 rounded-3xl bg-white p-2 transition-all active:scale-[0.98]"
                    onClick={() => {
                      setSelectedProduct(product);
                      setDetailsQuantity(1);
                      setItemNotes("");
                      setEditingCartItemIndex(null);
                    }}
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Utensils className="h-6 w-6 text-gray-200" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between py-1 pr-2">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                        <p className="line-clamp-2 text-[10px] leading-relaxed text-gray-400">
                          {product.description || "Ingredientes selecionados para o melhor sabor."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-gray-900">{formatPrice(product.price)}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg transition-transform group-hover:scale-110">
                          <Plus className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* 5. Product Details Modal (Sheet) */}
      <Sheet open={!!selectedProduct} onOpenChange={(open) => {
        if (!open) {
          setSelectedProduct(null);
          setEditingCartItemIndex(null);
        }
      }}>
        <SheetContent side="bottom" hideClose className="mx-auto flex h-[85vh] max-w-md flex-col rounded-t-[3rem] border-none p-0 shadow-2xl">
          {selectedProduct && (
            <>
              {/* Product Header / Image */}
              <div className="relative aspect-video w-full overflow-hidden">
                {selectedProduct.imageUrl ? (
                  <Image src={selectedProduct.imageUrl} alt={selectedProduct.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <Utensils className="h-12 w-12 text-gray-200" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-6 top-6 h-10 w-10 rounded-full bg-black/20 text-white backdrop-blur-md"
                  onClick={() => setSelectedProduct(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Product Info */}
              <div className="flex-1 overflow-y-auto px-8 pt-8">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl font-black tracking-tight text-gray-900">{selectedProduct.name}</h2>
                    <span className="text-xl font-black text-primary">{formatPrice(selectedProduct.price)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {selectedProduct.description || "Descrição detalhada do produto não informada. Preparado com todo o cuidado para garantir a melhor experiência gastronômica."}
                  </p>
                </div>

                {/* Observations Field */}
                <div className="mt-8 space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Alguma observação?
                  </label>
                  <Textarea
                    placeholder="Ex: sem cebola, ponto da carne mal passado, retirar tomate..."
                    className="min-h-[100px] rounded-2xl border-none bg-gray-50 p-4 text-sm focus-visible:ring-primary/20"
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Footer with Quantity & Add Button */}
              <div className="flex flex-col gap-4 border-t px-8 pb-10 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quantidade</span>
                  <div className="flex items-center gap-4 rounded-2xl border bg-muted p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl"
                      onClick={() => setDetailsQuantity(Math.max(1, detailsQuantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-6 text-center text-sm font-black">{detailsQuantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl"
                      onClick={() => setDetailsQuantity(detailsQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="h-16 w-full rounded-[2rem] bg-gray-900 text-lg font-black text-white shadow-xl active:scale-[0.98]"
                  onClick={() => handleAddToCart(selectedProduct, detailsQuantity, itemNotes)}
                >
                  {editingCartItemIndex !== null ? "ATUALIZAR ITEM" : "ADICIONAR À SACOLA"} • {formatPrice(selectedProduct.price * detailsQuantity)}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Floating Action Cart Button */}
      {totalItems > 0 && !isCartOpen && !selectedProduct && (
        <footer className="fixed bottom-8 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-6 duration-500 animate-in slide-in-from-bottom-8">
          <Button
            onClick={() => setIsCartOpen(true)}
            className="flex h-18 w-full items-center justify-between rounded-[2.5rem] bg-gray-900 px-8 text-white shadow-2xl transition-all hover:bg-gray-900 active:scale-95"
          >
            <div className="flex items-center gap-5">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black uppercase text-gray-400">Sacola</span>
                <span className="text-sm font-bold">{totalItems} {totalItems === 1 ? "ITEM" : "ITENS"}</span>
              </div>
            </div>
            <span className="text-xl font-black">{formatPrice(totalPrice)}</span>
          </Button>
        </footer>
      )}

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent
          side="bottom"
          hideClose
          className="mx-auto flex h-[90vh] max-w-md flex-col rounded-t-[3rem] border-none p-0 shadow-2xl"
        >
          <SheetHeader className="px-8 pt-8">
            <SheetTitle className="flex items-center justify-between text-2xl font-black italic tracking-tighter text-foreground">
              SUA SACOLA
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(false)}
                className="h-12 w-12 rounded-full bg-muted ring-2 ring-primary ring-offset-2 transition-all hover:bg-muted hover:ring-primary active:scale-95"
              >
                <X className="h-5 w-5" />
              </Button>
            </SheetTitle>
          </SheetHeader>

          <main className="flex-1 space-y-6 overflow-y-auto px-8 pt-2">
            {cart.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-medium text-muted-foreground">
                  Sua sacola está vazia.
                </p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
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
                  <div className="flex-1 space-y-1 cursor-pointer" onClick={() => handleEditCartItem(index)}>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">
                        {item.name}
                      </h4>
                      <Pencil className="h-3 w-3 text-muted-foreground opacity-40" />
                    </div>
                    {item.notes && (
                      <p className="text-[10px] italic text-muted-foreground line-clamp-1">
                        "{item.notes}"
                      </p>
                    )}
                    <p className="text-xs font-black text-primary">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl text-muted-foreground transition-colors hover:text-destructive"
                      onClick={() => updateQuantity(item.id, item.notes, -1)}
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
                      onClick={() => updateQuantity(item.id, item.notes, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </main>

          <div className="flex flex-col gap-4 px-8 pb-10 pt-6 border-t">
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

            <div className="flex flex-col gap-2 rounded-[2rem] border border-border bg-muted p-6">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-lg font-black text-foreground">
                <span>Total</span>
                <span className="text-primary font-black">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>

            <Button
              className="h-16 w-full rounded-[2rem] bg-foreground text-lg font-black text-background shadow-xl shadow-slate-200 transition-all hover:bg-foreground disabled:opacity-50 active:scale-[0.98]"
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
          </div>
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

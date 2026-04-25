"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Utensils,
  Loader2,
  X,
  Instagram,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Pencil,
  User,
  Mail,
  Calendar,
  Star,
} from "lucide-react";
import { format, parseISO } from "date-fns";

import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/_components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { toast } from "sonner";
import { DatePicker } from "@/app/_components/ui/date-picker";

import { createOrderAction } from "@/app/_actions/order/create-order";
import { MenuHeader } from "./menu-header";
import { CategoryNav } from "./category-nav";
import { ProductSection } from "./product-section";
import { ProductDetailsSheet } from "./product-details-sheet";
import { FloatingCartButton } from "./floating-cart-button";
import { BottomNav } from "./bottom-nav";
import { IdentificationDialog } from "./identification-dialog";
import { useCartStore } from "../_store/use-cart-store";
import { supabase } from "@/app/_lib/supabase";

interface MenuClientProps {
  companyId: string;
  menuData: any;
  customerData?: any;
  tableNumber: string | null;
}

const DEFAULT_HOURS = [
  { day: "Segunda", open: "18:00", close: "23:00", closed: false },
  { day: "Terça", open: "18:00", close: "23:00", closed: false },
  { day: "Quarta", open: "18:00", close: "23:00", closed: false },
  { day: "Quinta", open: "18:00", close: "23:00", closed: false },
  { day: "Sexta", open: "18:00", close: "23:30", closed: false },
  { day: "Sábado", open: "11:30", close: "23:30", closed: false },
  { day: "Domingo", open: "11:30", close: "23:00", closed: false },
];

export function MenuClient({
  companyId,
  menuData,
  customerData,
  tableNumber,
}: MenuClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isStoreInfoOpen, setIsStoreInfoOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Identification State
  const [showIdentifyDialog, setShowIdentifyDialog] = useState(false);
  const [identifyStep, setIdentifyStep] = useState<"PHONE" | "DETAILS">("PHONE");
  const [customer, setCustomer] = useState(customerData);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [identifyForm, setIdentifyForm] = useState({
    phoneNumber: "",
    name: "",
    email: "",
    birthDate: "",
  });

  const [currentMenuData, setCurrentMenuData] = useState(menuData);

  // Real-time synchronization
  useEffect(() => {
    const channel = supabase
      .channel(`menu-sync-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Product",
          filter: `companyId=eq.${companyId}`,
        },
        (payload) => {
          console.log("🔔 [MenuClient] Real-time event received:", payload.eventType, payload.new);
          
          if (payload.eventType === "UPDATE") {
            const updatedProduct = payload.new as any;
            
            setCurrentMenuData((prev) => {
              const newCategories = prev.categories.map((cat) => ({
                ...cat,
                products: cat.products.map((p) => 
                  p.id === updatedProduct.id 
                    ? { ...p, ...updatedProduct, price: Number(updatedProduct.price), promoPrice: updatedProduct.promoPrice ? Number(updatedProduct.promoPrice) : null } 
                    : p
                ).filter(p => p.isVisibleOnMenu && p.isActive) // Filter out if hidden
              })).filter(cat => cat.products.length > 0);
              
              return { ...prev, categories: newCategories };
            });
          }
          
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, router]);

  // Update local state when prop changes (from router.refresh)
  useEffect(() => {
    setCurrentMenuData(menuData);
  }, [menuData]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const filteredCategories = useMemo(() => {
    if (!search) return currentMenuData.categories;
    const searchLower = search.toLowerCase();
    return currentMenuData.categories
      .map((category: any) => ({
        ...category,
        products: category.products.filter(
          (product: any) =>
            product.name.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((category: any) => category.products.length > 0);
  }, [search, currentMenuData.categories]);

  const highlights = useMemo(() => {
    return currentMenuData.categories
      .flatMap((c: any) => c.products)
      .filter((p: any) => p.isFeatured)
      .slice(0, 8);
  }, [currentMenuData.categories]);

  const status = useMemo(() => {
    return { isOpen: true, label: "Aberto agora" };
  }, []);

  const scrollToCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const offset = 140;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleIdentifyPhone = async () => {
    if (!identifyForm.phoneNumber) return;
    setIsIdentifying(true);
    try {
      const response = await fetch(`/api/customers/check?phone=${identifyForm.phoneNumber}&companyId=${companyId}`);
      const data = await response.json();

      if (data.exists) {
        setCustomer(data.customer);
        toast.success(`Bem-vindo de volta, ${data.customer.name}!`);
        setShowIdentifyDialog(false);
        await submitOrder(data.customer.customerId);
      } else {
        setIdentifyStep("DETAILS");
      }
    } catch {
      toast.error("Erro ao verificar telefone");
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleRegister = async () => {
    if (!identifyForm.name || !identifyForm.phoneNumber) return;
    setIsIdentifying(true);
    try {
      const response = await fetch("/api/customers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...identifyForm, companyId }),
      });
      const data = await response.json();

      if (data.success) {
        setCustomer(data.customer);
        setShowIdentifyDialog(false);
        await submitOrder(data.customer.customerId);
      } else {
        toast.error(data.message || "Erro ao realizar cadastro");
      }
    } catch {
      toast.error("Erro inesperado ao realizar cadastro");
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleLogout = () => {
    setCustomer(null);
    setIdentifyForm({ phoneNumber: "", name: "", email: "", birthDate: "" });
    setIdentifyStep("PHONE");
    toast.info("Você saiu da sua conta");
  };

  const submitOrder = async (customerId: string) => {
    const items = useCartStore.getState().items;
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await createOrderAction({
        companyId,
        customerId,
        tableNumber: tableNumber ?? undefined,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          notes: item.notes,
        })),
      });

      if (result?.data?.success && result.data.orderId) {
        toast.success("Pedido enviado com sucesso! 🎉");
        useCartStore.getState().clearCart();
        setShowIdentifyDialog(false);
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

  const handleIdentify = () => identifyStep === "PHONE" ? handleIdentifyPhone() : handleRegister();

  const handleCheckout = async () => {
    const items = useCartStore.getState().items;
    if (items.length === 0) return;
    if (!customer) {
      setShowIdentifyDialog(true);
      return;
    }
    await submitOrder(customer.customerId);
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-white font-sans shadow-2xl">
      <MenuHeader
        menuData={currentMenuData}
        status={status}
        customer={customer}
        handleLogout={handleLogout}
        totalItems={useCartStore((state) => state.totalItems)}
        setIsCartOpen={() => {}} 
        setIsStoreInfoOpen={setIsStoreInfoOpen}
        tableNumber={tableNumber}
        onBack={() => router.back()}
      />

      <div className="relative mt-8 px-6">
        <Search className="absolute left-10 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="O que você quer comer hoje?"
          className="h-14 rounded-2xl border-none bg-gray-100 pl-12 text-sm shadow-inner focus-visible:ring-primary/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {highlights.length > 0 && (
        <section className="py-6">
          <div className="flex items-center justify-between px-6 pb-4">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              Destaques Imperdíveis
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto snap-x px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {highlights.map((product: any) => (
              <div 
                key={product.id} 
                className="w-72 shrink-0 snap-start"
                onClick={() => setSelectedProduct(product)}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm font-black text-white line-clamp-1">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.promoPrice ? (
                        <>
                          <p className="text-sm font-black text-primary">{formatPrice(product.promoPrice)}</p>
                          <p className="text-[10px] font-bold text-gray-400 line-through">{formatPrice(product.price)}</p>
                        </>
                      ) : (
                        <p className="text-sm font-black text-primary">{formatPrice(product.price)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <CategoryNav
        categories={currentMenuData.categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={scrollToCategory}
      />

      <main className="flex-1 space-y-10 px-6 py-8 pb-32">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Utensils className="h-12 w-12 text-gray-200 opacity-20" />
            <h3 className="mt-4 text-sm font-medium text-gray-400">Nenhum produto encontrado.</h3>
          </div>
        ) : (
          filteredCategories.map((category: any) => (
            <ProductSection
              key={category.id}
              id={`category-${category.id}`}
              title={category.name}
              products={category.products}
              onProductClick={setSelectedProduct}
            />
          ))
        )}
      </main>

      {/* Product Details Sheet */}
      <ProductDetailsSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Floating Cart Button */}
      <FloatingCartButton companyId={companyId} />

      {/* Bottom Navigation Bar */}
      <BottomNav companySlug={currentMenuData.slug} />

      {/* Customer Identification Dialog */}
      <IdentificationDialog
        open={showIdentifyDialog}
        onOpenChange={setShowIdentifyDialog}
        step={identifyStep}
        setStep={setIdentifyStep}
        form={identifyForm}
        setForm={setIdentifyForm}
        isIdentifying={isIdentifying}
        onIdentify={handleIdentify}
      />

      {/* Store Information Modal */}
      <Dialog open={isStoreInfoOpen} onOpenChange={setIsStoreInfoOpen}>
        <DialogContent className="max-w-md gap-0 p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10">
            <DialogTitle className="text-xl font-black text-gray-900 text-center">
              {menuData.companyName}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full h-14 rounded-none bg-white border-b p-0 gap-0">
              <TabsTrigger 
                value="about" 
                className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs font-black uppercase tracking-widest text-gray-400 data-[state=active]:text-gray-900 transition-all"
              >
                Sobre
              </TabsTrigger>
              <TabsTrigger 
                value="hours" 
                className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs font-black uppercase tracking-widest text-gray-400 data-[state=active]:text-gray-900 transition-all"
              >
                Horário
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Logo & Description */}
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative h-28 w-28 overflow-hidden rounded-[2rem] border-4 border-gray-50 bg-white shadow-xl">
                  <Image
                    src={currentMenuData.logoUrl || "/logo/logo-kipo.png"}
                    alt="Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm leading-relaxed text-gray-600 font-medium px-2">
                  {currentMenuData.description || "Bem-vindo à nossa loja! Oferecemos os melhores produtos com qualidade e carinho."}
                </p>
              </div>

              {/* Instagram Link */}
              {currentMenuData.instagramUrl && (
                <a 
                  href={`https://instagram.com/${currentMenuData.instagramUrl.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-pink-100/50 hover:scale-[1.02] transition-transform"
                >
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <Instagram size={20} />
                  </div>
                  <span className="text-sm font-bold text-gray-800">@{currentMenuData.instagramUrl.replace('@', '')}</span>
                </a>
              )}

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Contato</h3>
                <div className="grid grid-cols-1 gap-3">
                  {currentMenuData.whatsappNumber && (
                    <a 
                      href={`https://wa.me/${currentMenuData.whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white hover:border-green-200 hover:bg-green-50/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <MessageCircle className="text-green-500" size={20} />
                        <span className="text-sm font-bold text-gray-700">WhatsApp</span>
                      </div>
                      <span className="text-sm font-black text-gray-900">{currentMenuData.whatsappNumber}</span>
                    </a>
                  )}
                  {/* Phone */}
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white group">
                    <div className="flex items-center gap-3">
                      <Phone className="text-gray-400" size={20} />
                      <span className="text-sm font-bold text-gray-700">Telefone</span>
                    </div>
                    <span className="text-sm font-black text-gray-900">{currentMenuData.whatsappNumber || "(84) 99999-9999"}</span>
                  </div>
                </div>
              </div>

              {/* Address Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Endereço</h3>
                <div className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                  <div className="mt-0.5">
                    <MapPin className="text-gray-400" size={20} />
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600 font-medium">
                    {currentMenuData.address || "Endereço não cadastrado"}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hours" className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-800">
                <Clock size={18} className="shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">Horários sujeitos a alteração em feriados</p>
              </div>

              <div className="space-y-1">
                {(currentMenuData.operatingHours || DEFAULT_HOURS).map((item: any) => {
                  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long" }).toLowerCase();
                  const isToday = item.day.toLowerCase() === today;
                  
                  return (
                    <div 
                      key={item.day}
                      className={`flex justify-between items-start p-4 rounded-2xl transition-all ${
                        isToday ? "bg-primary/5 border border-primary/10" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className={`text-sm font-bold ${isToday ? "text-primary" : "text-gray-700"}`}>
                        {item.day}
                      </span>
                      <div className="text-right whitespace-pre-line text-sm font-black text-gray-900">
                        {item.closed ? (
                          <span className="text-rose-500 uppercase">Fechado</span>
                        ) : (
                          `${item.open} às ${item.close}`
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

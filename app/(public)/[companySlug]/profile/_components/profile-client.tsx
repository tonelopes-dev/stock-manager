"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, Calendar, LogOut, Save, Loader2 } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BottomNav } from "../../_components/bottom-nav";
import { PromotionsModal } from "../../_components/promotions-modal";
import { ProductDetailsSheet } from "../../_components/product-details-sheet";
import { FloatingCartButton } from "../../_components/floating-cart-button";
import { useUIStore } from "../../_store/use-ui-store";

interface ProfileClientProps {
  companySlug: string;
  companyId: string;
  companyName: string;
}

export function ProfileClient({ companySlug, companyId, companyName }: ProfileClientProps) {
  const router = useRouter();
  const { openPromotionsModal } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    birthDate: "",
  });

  useEffect(() => {
    const savedCustomer = localStorage.getItem(`kipo-customer-${companyId}`);
    if (savedCustomer) {
      try {
        const customer = JSON.parse(savedCustomer);
        setForm({
          name: customer.name || "",
          phoneNumber: customer.phoneNumber || "",
          email: customer.email || "",
          birthDate: customer.birthDate ? new Date(customer.birthDate).toISOString().split('T')[0] : "",
        });
      } catch (e) {
        console.error("Error parsing customer data");
      }
    }
    setLoading(false);
  }, [companyId]);

  const handleLogout = () => {
    localStorage.removeItem(`kipo-customer-${companyId}`);
    toast.success("Você saiu da sua conta");
    router.push(`/${companySlug}`);
  };

  const handleSave = async () => {
    if (!form.name || !form.phoneNumber) {
      toast.error("Nome e Telefone são obrigatórios");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/customers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, companyId }),
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify(data.customer));
        toast.success("Perfil atualizado com sucesso!");
      } else {
        toast.error(data.message || "Erro ao atualizar perfil");
      }
    } catch {
      toast.error("Erro inesperado ao salvar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50/50 font-sans shadow-2xl">
      <header className="sticky top-0 z-20 bg-white/95 px-6 pb-6 pt-10 shadow-sm backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              Meu Perfil
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
              {companyName}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-xl shadow-gray-200">
            <User size={24} />
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 pb-32">
        <div className="space-y-8">
          {/* Form Group */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Seu nome"
                  className="h-14 rounded-2xl border-none bg-white pl-12 text-sm shadow-sm focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-14 rounded-2xl border-none bg-white pl-12 text-sm shadow-sm focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                E-mail (Opcional)
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="h-14 rounded-2xl border-none bg-white pl-12 text-sm shadow-sm focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Data de Nascimento
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  className="h-14 rounded-2xl border-none bg-white pl-12 text-sm shadow-sm focus-visible:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-16 w-full rounded-[2rem] bg-primary text-white shadow-xl shadow-primary/20 text-sm font-black uppercase tracking-widest hover:bg-primary/90"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Salvar Alterações
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="h-16 w-full rounded-[2rem] border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all text-sm font-black uppercase tracking-widest border-2"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sair da Conta
            </Button>
          </div>
        </div>
      </main>

      {/* Promotions Modal */}
      <PromotionsModal
        companySlug={companySlug}
        onSelectProduct={setSelectedProduct}
      />

      {/* Product Details Sheet */}
      <ProductDetailsSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Floating Cart Button */}
      <FloatingCartButton companyId={companyId} />

      {/* Bottom Navigation */}
      <BottomNav 
        companySlug={companySlug} 
      />
    </div>
  );
}

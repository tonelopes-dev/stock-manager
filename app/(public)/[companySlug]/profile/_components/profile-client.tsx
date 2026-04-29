"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, Calendar, LogOut, Save, Loader2, Check, Camera } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { BottomNav } from "../../_components/bottom-nav";
import { PromotionsModal } from "../../_components/promotions-modal";
import { ProductDetailsSheet } from "../../_components/product-details-sheet";
import { FloatingCartButton } from "../../_components/floating-cart-button";
import { SelfieCamera } from "../../_components/selfie-camera";
import { useUIStore } from "../../_store/use-ui-store";
import { formatPhoneNumber } from "@/app/_lib/utils";
import { updateCustomerSelfie } from "@/app/_actions/customer/update-customer-selfie";
import { updateCustomerProfile } from "@/app/_actions/customer/update-customer-profile";

interface ProfileClientProps {
  companySlug: string;
  companyId: string;
  companyName: string;
}

export function ProfileClient({ companySlug, companyId, companyName }: ProfileClientProps) {
  const router = useRouter();
  const { openPromotionsModal } = useUIStore();
  const [loading, setLoading] = useState(true);
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    birthDate: "",
    imageUrl: "",
  });

  // Login flow state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [showRegisterFields, setShowRegisterFields] = useState(false);

  useEffect(() => {
    const savedCustomer = localStorage.getItem(`kipo-customer-${companyId}`);
    if (savedCustomer) {
      try {
        const customer = JSON.parse(savedCustomer);
        setCustomerId(customer.customerId || customer.id || null);
        setForm({
          name: customer.name || "",
          phoneNumber: customer.phoneNumber ? formatPhoneNumber(customer.phoneNumber) : "",
          email: customer.email || "",
          birthDate: customer.birthDate ? new Date(customer.birthDate).toISOString().split('T')[0] : "",
          imageUrl: customer.imageUrl || "",
        });
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Error parsing customer data");
      }
    }
    setLoading(false);
  }, [companyId]);

  const handleLogout = () => {
    localStorage.removeItem(`kipo-customer-${companyId}`);
    toast.success("Você saiu da sua conta");
    setIsLoggedIn(false);
    setLoginPhone("");
    setLoginName("");
    setShowRegisterFields(false);
  };

  const handleLoginContinue = async () => {
    const cleanPhone = loginPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Informe um telefone válido.");
      return;
    }

    setIsCheckingPhone(true);
    try {
      if (showRegisterFields) {
        if (!loginName.trim()) {
          toast.error("Por favor, informe seu nome.");
          setIsCheckingPhone(false);
          return;
        }

        const regRes = await fetch("/api/customers/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: loginName, 
            phoneNumber: cleanPhone, 
            companyId 
          }),
        });
        const regData = await regRes.json();

        if (regData.success) {
          localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify(regData.customer));
          setForm({
            name: regData.customer.name || "",
            phoneNumber: regData.customer.phoneNumber ? formatPhoneNumber(regData.customer.phoneNumber) : "",
            email: regData.customer.email || "",
            birthDate: regData.customer.birthDate ? new Date(regData.customer.birthDate).toISOString().split('T')[0] : "",
            imageUrl: regData.customer.imageUrl || "",
          });
          setIsLoggedIn(true);
          toast.success(`Bem-vindo(a), ${regData.customer.name.split(' ')[0]}!`);
        } else {
          toast.error(regData.message || "Erro ao realizar cadastro.");
        }
      } else {
        const res = await fetch(`/api/customers/check?phone=${cleanPhone}&companyId=${companyId}`);
        const data = await res.json();

        if (data.exists) {
          localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify(data.customer));
          setForm({
            name: data.customer.name || "",
            phoneNumber: data.customer.phoneNumber ? formatPhoneNumber(data.customer.phoneNumber) : "",
            email: data.customer.email || "",
            birthDate: data.customer.birthDate ? new Date(data.customer.birthDate).toISOString().split('T')[0] : "",
            imageUrl: data.customer.imageUrl || "",
          });
          setIsLoggedIn(true);
          toast.success(`Olá novamente, ${data.customer.name.split(' ')[0]}!`);
        } else {
          setShowRegisterFields(true);
          toast.info("Não encontramos seu cadastro. Informe seu nome para criar a conta!");
        }
      }
    } catch {
      toast.error("Erro ao processar acesso.");
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handlePhotoCapture = async (blob: Blob) => {
    if (!customerId) {
      toast.error("Identificação do cliente não encontrada.");
      return;
    }

    const toastId = toast.loading("Enviando foto...");
    setIsCameraOpen(false);

    try {
      // 1. Upload to Vercel Blob
      const filename = `customer-${customerId}-${Date.now()}.jpg`;
      const response = await fetch(`/api/upload?filename=${filename}&category=customers&companySlug=${companySlug}`, {
        method: "POST",
        body: blob,
      });

      if (!response.ok) throw new Error("Falha no upload");
      
      const blobData = await response.json();
      const imageUrl = blobData.url;

      // 2. Update DB
      const result = await updateCustomerSelfie(customerId, imageUrl);
      
      if (result.success) {
        // 3. Update state and localStorage
        setForm(prev => ({ ...prev, imageUrl }));
        
        const savedCustomer = localStorage.getItem(`kipo-customer-${companyId}`);
        if (savedCustomer) {
          const customerData = JSON.parse(savedCustomer);
          customerData.imageUrl = imageUrl;
          localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify(customerData));
        }
        
        toast.success("Foto atualizada com sucesso!", { id: toastId });
      } else {
        throw new Error(result.error || "Falha ao salvar no banco");
      }
    } catch (error) {
      console.error("Error updating photo:", error);
      toast.error("Erro ao atualizar foto. Tente novamente.", { id: toastId });
    }
  };

  const handleSave = async () => {
    const cleanPhone = form.phoneNumber.replace(/\D/g, "");
    if (!form.name || !cleanPhone) {
      toast.error("Nome e Telefone são obrigatórios");
      return;
    }

    if (!customerId) {
      toast.error("Erro de autenticação: Identificador do cliente não encontrado.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateCustomerProfile({
        customerId,
        name: form.name,
        email: form.email,
        phoneNumber: cleanPhone,
        birthDate: form.birthDate,
        companyId,
      });

      if (result.success) {
        localStorage.setItem(`kipo-customer-${companyId}`, JSON.stringify(result.customer));
        toast.success("Perfil atualizado com sucesso!");
      } else {
        toast.error(result.message || "Erro ao atualizar perfil");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
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
              {isLoggedIn ? "Meu Perfil" : "Acessar Conta"}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
              {companyName}
            </p>
          </div>
          <div className="relative">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 p-[4px] shadow-xl shadow-primary/10">
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gray-900 text-white">
                {form.imageUrl ? (
                  <Image
                    src={form.imageUrl}
                    alt={form.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User size={32} />
                )}
              </div>
            </div>
            
            {/* Camera Overlay Button */}
            <button
              onClick={() => setIsCameraOpen(true)}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow-lg ring-4 ring-white hover:scale-110 transition-transform active:scale-95"
              title="Atualizar foto"
            >
              <Camera size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 pb-32">
        {!isLoggedIn ? (
          <div className="space-y-6 rounded-[2rem] bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 text-center mb-6">
              Identifique-se para continuar
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Telefone (WhatsApp)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(formatPhoneNumber(e.target.value))}
                    placeholder="(00) 00000-0000"
                    type="tel"
                    disabled={isCheckingPhone || showRegisterFields}
                    className="h-14 rounded-2xl border-none bg-gray-50 pl-12 text-sm shadow-inner focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              {showRegisterFields && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Como podemos te chamar?
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder="Seu nome"
                      disabled={isCheckingPhone}
                      className="h-14 rounded-2xl border-none bg-gray-50 pl-12 text-sm shadow-inner focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleLoginContinue}
              disabled={isCheckingPhone || !loginPhone}
              className="mt-8 h-16 w-full rounded-[2rem] bg-primary text-white shadow-xl shadow-primary/20 text-sm font-black uppercase tracking-widest hover:bg-primary/90"
            >
              {isCheckingPhone ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                showRegisterFields ? "Criar Conta e Acessar" : "Continuar"
              )}
            </Button>
            
            {showRegisterFields && (
              <Button
                variant="ghost"
                onClick={() => setShowRegisterFields(false)}
                disabled={isCheckingPhone}
                className="w-full mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                Voltar
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in">
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
                    onChange={(e) => setForm({ ...form, phoneNumber: formatPhoneNumber(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    type="tel"
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
                    type="email"
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
        )}
      </main>

      {/* Camera Modal */}
      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none p-0 overflow-hidden bg-white max-h-[90vh]">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-center">
              Atualizar Foto
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-8">
            <SelfieCamera onCapture={handlePhotoCapture} />
          </div>
        </DialogContent>
      </Dialog>

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

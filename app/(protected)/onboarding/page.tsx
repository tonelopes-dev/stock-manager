"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Package, ShoppingCart, Bell, Sparkles } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { updateOnboarding } from "@/app/_actions/onboarding/update-onboarding";
import { toast } from "sonner";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("");
  const [sellingFrequency, setSellingFrequency] = useState("");
  const router = useRouter();

  const handleNext = () => setStep((prev) => prev + 1);

  const handleFinish = async () => {
    try {
      await updateOnboarding({
        onboardingStep: 1, // Step 1 completed (Welcome + Questions)
        businessType: businessType,
      });
      toast.success("Setup concluído! Bem-vindo ao Stockly.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error("Erro ao salvar configuração.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {step === 1 && (
          <Card className="border-none shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
                <Sparkles className="text-primary w-8 h-8" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">
                  Bem-vindo ao Stockly
                </CardTitle>
                <CardDescription className="text-base font-medium text-slate-500">
                  Vamos organizar seu estoque em menos de 2 minutos.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <OnboardingChecklistItem 
                  icon={<Package className="w-5 h-5 text-slate-400" />}
                  label="Criar seu primeiro produto"
                />
                <OnboardingChecklistItem 
                  icon={<ShoppingCart className="w-5 h-5 text-slate-400" />}
                  label="Registrar sua primeira venda"
                />
                <OnboardingChecklistItem 
                  icon={<Bell className="w-5 h-5 text-slate-400" />}
                  label="Ver alertas automáticos"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleNext} className="w-full h-12 text-base font-bold gap-2">
                Começar agora <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Conte um pouco sobre você</CardTitle>
              <CardDescription>Isso nos ajuda a personalizar sua experiência.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">O que você vende?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Doces", "Comida", "Loja", "Outro"].map((type) => (
                    <Button
                      key={type}
                      variant={businessType === type ? "default" : "outline"}
                      className="h-10 font-medium"
                      onClick={() => setBusinessType(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">Você vende todos os dias?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Sim", "Às vezes"].map((freq) => (
                    <Button
                      key={freq}
                      variant={sellingFrequency === freq ? "default" : "outline"}
                      className="h-10 font-medium"
                      onClick={() => setSellingFrequency(freq)}
                    >
                      {freq}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleFinish} 
                className="w-full h-12 text-base font-bold"
                disabled={!businessType || !sellingFrequency}
              >
                Ir para o Dashboard
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

function OnboardingChecklistItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:border-primary/20 hover:bg-white hover:shadow-sm">
      <div className="shrink-0">{icon}</div>
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <div className="ml-auto w-5 h-5 rounded-full border-2 border-slate-200" />
    </div>
  );
}

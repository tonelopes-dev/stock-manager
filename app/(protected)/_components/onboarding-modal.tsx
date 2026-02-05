"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/_components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { completeOnboardingSchema, CompleteOnboardingSchema } from "@/app/_actions/onboarding/complete-onboarding/schema";
import { completeOnboarding } from "@/app/_actions/onboarding/complete-onboarding";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Loader2Icon, CheckCircle2Icon, PackageIcon, Building2Icon } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
}

export const OnboardingModal = ({ isOpen }: OnboardingModalProps) => {
  const [step, setStep] = useState(1);

  const form = useForm<CompleteOnboardingSchema>({
    resolver: zodResolver(completeOnboardingSchema),
    defaultValues: {
      companyName: "",
      productName: "",
      productPrice: 0,
      productStock: 0,
    },
  });

  const { execute, status } = useAction(completeOnboarding, {
    onSuccess: () => {
      setStep(3);
      toast.success("Configuração concluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao finalizar configuração. Tente novamente.");
      console.error(error);
    },
  });

  const onSubmit = (data: CompleteOnboardingSchema) => {
    execute(data);
  };

  const nextStep = async () => {
    if (step === 1) {
      const isValid = await form.trigger("companyName");
      if (isValid) setStep(2);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[450px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex justify-center mb-4">
             <div className="bg-primary/10 p-3 rounded-full">
                {step === 1 && <Building2Icon className="h-6 w-6 text-primary" />}
                {step === 2 && <PackageIcon className="h-6 w-6 text-primary" />}
                {step === 3 && <CheckCircle2Icon className="h-8 w-8 text-green-500" />}
             </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            {step === 1 && "Bem-vindo ao Stockly!"}
            {step === 2 && "Seu primeiro produto"}
            {step === 3 && "Tudo pronto! 🚀"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 1 && "Vamos começar definindo o nome da sua empresa."}
            {step === 2 && "Cadastre um item básico para ver o sistema em ação."}
            {step === 3 && "Sua empresa e seu primeiro produto foram configurados."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {step === 1 && (
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Minha Loja Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Camiseta Básica" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Inicial</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="py-6 text-center space-y-4">
                 <p className="text-muted-foreground">
                    Agora você já pode gerenciar suas vendas e acompanhar seu estoque em tempo real.
                 </p>
              </div>
            )}

            <DialogFooter className="flex gap-2 sm:justify-center">
              {step === 1 && (
                <Button type="button" onClick={nextStep} className="w-full">
                  Próximo Passo
                </Button>
              )}
              {step === 2 && (
                <div className="flex w-full gap-2">
                   <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={status === "executing"}>
                      Voltar
                   </Button>
                   <Button type="submit" className="flex-1" disabled={status === "executing"}>
                     {status === "executing" ? <Loader2Icon className="animate-spin h-4 w-4 mr-2" /> : null}
                     Finalizar Configuração
                   </Button>
                </div>
              )}
              {step === 3 && (
                <Button type="button" onClick={() => window.location.reload()} className="w-full">
                  Começar a usar agora
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

"use client";

import { CompanyIntegrationDto } from "@/app/_data-access/integration/types";
import { IntegrationProvider } from "@prisma/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/app/_components/ui/sheet";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Switch } from "@/app/_components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { upsertInfinityPaySchema } from "@/app/_actions/integration/schema";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { upsertInfinityPayIntegration } from "@/app/_actions/integration/upsert-integration";
import { toast } from "sonner";
import { Loader2, ShieldCheck, KeyRound, Store } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { useEffect } from "react";

interface InfinityPayConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  integration?: CompanyIntegrationDto;
}

type FormValues = z.infer<typeof upsertInfinityPaySchema>;

export function InfinityPayConfigSheet({ open, onOpenChange, companyId, integration }: InfinityPayConfigSheetProps) {
  
  const form = useForm<FormValues>({
    resolver: zodResolver(upsertInfinityPaySchema),
    defaultValues: {
      provider: IntegrationProvider.INFINITYPAY,
      companyId,
      merchantId: integration?.config?.merchantId || "",
      isEnabled: integration?.isEnabled ?? true, // Se tá criando, já sugere ativo
    },
  });

  // Atualiza o form se a integração mudar (ex: abriu o modal de novo)
  useEffect(() => {
    if (open) {
      form.reset({
        provider: IntegrationProvider.INFINITYPAY,
        companyId,
        merchantId: integration?.config?.merchantId || "",
        isEnabled: integration?.isEnabled ?? true,
      });
    }
  }, [open, integration, companyId, form]);

  const { execute, isExecuting } = useAction(upsertInfinityPayIntegration, {
    onSuccess: () => {
      toast.success("Integração salva com sucesso!");
      onOpenChange(false);
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Falha ao salvar integração.");
    }
  });

  const onSubmit = (data: FormValues) => {
    execute(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-2xl">
            <div className="bg-emerald-500 p-1.5 rounded-md text-white">
              <Store className="h-5 w-5" />
            </div>
            Configurar InfinitePay
          </SheetTitle>
          <SheetDescription>
            Insira suas credenciais da InfinitePay para aceitar pagamentos diretamente nas comandas do KIPO.
          </SheetDescription>
        </SheetHeader>

        <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-300">
          <ShieldCheck className="h-4 w-4 stroke-current" />
          <AlertTitle>Integração Simples</AlertTitle>
          <AlertDescription>
            Basta informar a sua InfiniteTag (Handle). O KIPO cuidará da geração do link e confirmação automática via Webhook.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="merchantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sua InfiniteTag (Handle)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: sua_loja (sem o $)" {...field} />
                  </FormControl>
                  <FormDescription>
                    O nome de usuário da sua loja na InfinitePay, que serve para identificar sua conta.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Ativar Pagamentos
                    </FormLabel>
                    <FormDescription>
                      Habilita o botão "Pagar Agora" na tela do cliente.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="pt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isExecuting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isExecuting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {integration ? "Atualizar Integração" : "Conectar InfinityPay"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

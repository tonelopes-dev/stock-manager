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
import { upsertMercadoPagoSchema } from "@/app/_actions/integration/schema";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { upsertMercadoPagoIntegration } from "@/app/_actions/integration/upsert-integration";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Store } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { useEffect } from "react";

interface MercadoPagoConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  integration?: CompanyIntegrationDto;
}

type FormValues = z.infer<typeof upsertMercadoPagoSchema>;

export function MercadoPagoConfigSheet({ open, onOpenChange, companyId, integration }: MercadoPagoConfigSheetProps) {
  
  const form = useForm<FormValues>({
    resolver: zodResolver(upsertMercadoPagoSchema),
    defaultValues: {
      provider: "MERCADOPAGO",
      companyId,
      accessToken: integration?.config?.accessToken || "",
      publicKey: integration?.config?.publicKey || "",
      isEnabled: integration?.isEnabled ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        provider: "MERCADOPAGO",
        companyId,
        accessToken: integration?.config?.accessToken || "",
        publicKey: integration?.config?.publicKey || "",
        isEnabled: integration?.isEnabled ?? true,
      });
    }
  }, [open, integration, companyId, form]);

  const { execute, isExecuting } = useAction(upsertMercadoPagoIntegration, {
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
            <div className="bg-blue-500 p-1.5 rounded-md text-white">
              <Store className="h-5 w-5" />
            </div>
            Configurar Mercado Pago
          </SheetTitle>
          <SheetDescription>
            Insira suas credenciais do Mercado Pago para aceitar pagamentos diretamente nas comandas do KIPO.
          </SheetDescription>
        </SheetHeader>

        <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-300">
          <ShieldCheck className="h-4 w-4 stroke-current" />
          <AlertTitle>Integração Segura</AlertTitle>
          <AlertDescription>
            Ao ativar o Mercado Pago, se houver outra integração de pagamento ativada, ela será automaticamente desativada para manter consistência no checkout do cliente.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token</FormLabel>
                  <FormControl>
                    <Input placeholder="APP_USR-..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Token de acesso privado da sua conta (Credenciais de Produção).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publicKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public Key</FormLabel>
                  <FormControl>
                    <Input placeholder="APP_USR-..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Chave pública da sua aplicação.
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
                      Habilita o botão "Pagar Agora" na tela do cliente usando Mercado Pago.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="pt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isExecuting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isExecuting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {integration ? "Atualizar Integração" : "Conectar Mercado Pago"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

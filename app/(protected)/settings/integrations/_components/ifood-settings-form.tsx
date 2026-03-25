"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/app/_components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Switch } from "@/app/_components/ui/switch";
import { updateIfoodSettingsAction } from "@/app/_actions/company/update-ifood-settings";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";

const formSchema = z.object({
  ifoodMerchantId: z.string().min(1, "Merchant ID é obrigatório"),
  ifoodClientId: z.string().min(1, "Client ID é obrigatório"),
  ifoodClientSecret: z.string().min(1, "Client Secret é obrigatório"),
  ifoodOrdersEnabled: z.boolean().default(false),
  ifoodAutoConfirm: z.boolean().default(true),
});

interface IfoodSettingsFormProps {
  initialData: any;
}

export function IfoodSettingsForm({ initialData }: IfoodSettingsFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ifoodMerchantId: initialData?.ifoodMerchantId || "",
      ifoodClientId: initialData?.ifoodClientId || "",
      ifoodClientSecret: initialData?.ifoodClientSecret || "",
      ifoodOrdersEnabled: initialData?.ifoodOrdersEnabled || false,
      ifoodAutoConfirm: initialData?.ifoodAutoConfirm ?? true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    try {
      const result = await updateIfoodSettingsAction(values);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erro inesperado ao salvar configurações.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="ifoodMerchantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID do Restaurante (Merchant ID)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 5cae768e-..." {...field} />
                </FormControl>
                <FormDescription>
                  Encontre este ID no Portal do Parceiro iFood.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ifoodClientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client ID (OAuth)</FormLabel>
                <FormControl>
                  <Input placeholder="Identificador do App" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ifoodClientSecret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Secret</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 rounded-lg bg-muted/30 p-4">
          <FormField
            control={form.control}
            name="ifoodOrdersEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Ativar Recebimento de Pedidos</FormLabel>
                  <FormDescription>
                    Permitir que novos pedidos do iFood caiam no PDV/KDS.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ifoodAutoConfirm"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Confirmação Automática</FormLabel>
                  <FormDescription>
                    Confirmar pedidos instantaneamente ao recebê-los.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </form>
    </Form>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { updateCompany } from "@/app/_actions/company/update-company";
import { updateCompanySchema, UpdateCompanySchema } from "@/app/_actions/company/update-company/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Switch } from "@/app/_components/ui/switch";
import { toast } from "sonner";
import { Loader2Icon, SaveIcon } from "lucide-react";

interface CompanyFormProps {
  initialData: {
    name: string;
    allowNegativeStock: boolean;
  };
}

export const CompanyForm = ({ initialData }: CompanyFormProps) => {
  const form = useForm<UpdateCompanySchema>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: initialData,
  });

  const { execute, isPending } = useAction(updateCompany, {
    onSuccess: () => {
      toast.success("Configurações atualizadas com sucesso!");
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao atualizar configurações.");
    },
  });

  const onSubmit = (values: UpdateCompanySchema) => {
    execute(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold text-slate-700">Nome da Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Minha Empresa LTDA" {...field} />
              </FormControl>
              <FormDescription>
                Este nome será exibido nos relatórios e faturas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowNegativeStock"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-100 p-4 bg-slate-50/50">
              <div className="space-y-0.5">
                <FormLabel className="text-base font-bold text-slate-800">
                  Permitir Estoque Negativo
                </FormLabel>
                <FormDescription className="text-xs">
                  Permite realizar vendas mesmo sem estoque disponível. Use com cautela.
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

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending} className="font-black px-8 h-12 gap-2">
            {isPending ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SaveIcon size={18} />
            )}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );
};

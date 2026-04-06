"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { updateCompany } from "@/app/_actions/company/update-company";
import { updateCompanySchema, UpdateCompanySchema } from "@/app/_actions/company/update-company/schema";
import { getAverageMonthlyVolume } from "@/app/_actions/company/get-average-volume";
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
import { Loader2Icon, SaveIcon, TrendingUpIcon, TargetIcon, Wand2Icon } from "lucide-react";
import { NumericFormat } from "react-number-format";

interface CompanyFormProps {
  initialData: {
    name: string;
    allowNegativeStock: boolean;
    estimatedMonthlyVolume: number;
    enableOverheadInjection: boolean;
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

  const { execute: calculateRealVolume, isPending: isCalculating } = useAction(getAverageMonthlyVolume, {
    onSuccess: ({ data }) => {
      if (data !== undefined) {
        form.setValue("estimatedMonthlyVolume", data);
        toast.info(`Volume sugerido: ${data} (média trimestral real)`);
      }
    },
    onError: () => toast.error("Não foi possível calcular o volume real."),
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
              <FormLabel className="font-bold text-foreground">Nome da Empresa</FormLabel>
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/50">
              <div className="space-y-0.5">
                <FormLabel className="text-base font-bold text-foreground">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="estimatedMonthlyVolume"
            render={({ field }) => (
              <FormItem className="rounded-lg border border-border p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUpIcon size={16} className="text-primary" />
                  <FormLabel className="text-sm font-bold text-foreground">
                    Volume Mensal Estimado
                  </FormLabel>
                </div>
                <FormControl>
                  <NumericFormat
                    customInput={Input}
                    decimalScale={0}
                    allowNegative={false}
                    onValueChange={(vals) => field.onChange(vals.floatValue)}
                    value={field.value}
                    placeholder="Ex: 1000"
                  />
                </FormControl>
                <FormDescription className="text-[10px]">
                  Impacta diretamente no cálculo do rateio (overhead).
                </FormDescription>
                
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 mt-2 gap-2 text-primary hover:text-primary hover:bg-primary/10 font-bold transition-all"
                  onClick={() => calculateRealVolume()}
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <Loader2Icon size={14} className="animate-spin" />
                  ) : (
                    <Wand2Icon size={14} />
                  )}
                  Sugerir com base nas vendas reais
                </Button>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enableOverheadInjection"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <TargetIcon size={16} className="text-primary" />
                    <FormLabel className="text-sm font-bold text-foreground">
                      Injeção Automática de Rateio
                    </FormLabel>
                  </div>
                  <FormDescription className="text-[10px]">
                    Preenche o Custo Operacional automaticamente em novos produtos.
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

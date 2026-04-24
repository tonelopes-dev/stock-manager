"use client";

import { Button } from "@/app/_components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Switch } from "@/app/_components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, TagIcon, Clock, CalendarDays } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { updateProductPromotion } from "@/app/_actions/product/update-product-promotion";
import { updateProductPromotionSchema, UpdateProductPromotionSchema, PromotionSchedule } from "@/app/_actions/product/update-product-promotion/schema";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { Label } from "@/app/_components/ui/label";
import { cn } from "@/app/_lib/utils";

interface PromotionSettingsModalProps {
  product: ProductDto;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  { label: "Dom", value: 0 },
  { label: "Seg", value: 1 },
  { label: "Ter", value: 2 },
  { label: "Qua", value: 3 },
  { label: "Qui", value: 4 },
  { label: "Sex", value: 5 },
  { label: "Sáb", value: 6 },
];

export const PromotionSettingsModal = ({ product, onOpenChange }: PromotionSettingsModalProps) => {
  const currentSchedule = product.promoSchedule as PromotionSchedule | null;

  const form = useForm<UpdateProductPromotionSchema>({
    resolver: zodResolver(updateProductPromotionSchema),
    defaultValues: {
      productId: product.id,
      promoActive: product.promoActive || false,
      promoPrice: product.promoPrice ? Number(product.promoPrice) : null,
      promoSchedule: currentSchedule || { type: "always", days: [0, 1, 2, 3, 4, 5, 6], startTime: "00:00", endTime: "23:59" },
    },
  });

  const { execute, isPending } = useAction(updateProductPromotion, {
    onSuccess: () => {
      toast.success("Configurações de promoção atualizadas!");
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao salvar promoção."),
  });

  const scheduleType = form.watch("promoSchedule.type");

  const onSubmit = (data: UpdateProductPromotionSchema) => {
    execute(data);
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <TagIcon className="text-primary" size={20} />
          Motor de Promoções
        </DialogTitle>
        <DialogDescription>
          Gerencie o preço especial e agendamento para <strong>{product.name}</strong>.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4 items-end bg-muted/30 p-4 rounded-xl border border-border/50">
            <FormField
              control={form.control}
              name="promoActive"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Status</FormLabel>
                  <div className="flex items-center gap-2 h-10">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <span className="text-sm font-medium">{field.value ? "Ativa" : "Inativa"}</span>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promoPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Preço Promo (R$)</FormLabel>
                  <FormControl>
                    <NumericFormat
                      customInput={Input}
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="R$ "
                      decimalScale={2}
                      placeholder={`Normal: R$ ${Number(product.price).toFixed(2)}`}
                      onValueChange={(vals) => field.onChange(vals.floatValue || null)}
                      value={field.value}
                      className="font-bold text-primary border-primary/20 focus-visible:ring-primary"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                Regras de Exibição
              </h4>
            </div>

            <Tabs 
              value={scheduleType} 
              onValueChange={(val) => form.setValue("promoSchedule.type", val as any)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="always" className="gap-2">
                  <TagIcon size={14} /> Sempre
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="gap-2">
                  <CalendarDays size={14} /> Programado
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scheduled" className="space-y-4 pt-4 animate-in fade-in-0 slide-in-from-top-2">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-bold text-muted-foreground">Dias da Semana</Label>
                  <FormField
                    control={form.control}
                    name="promoSchedule.days"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = field.value?.includes(day.value);
                          return (
                            <Button
                              key={day.value}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              className={cn(
                                "h-8 px-2.5 text-xs font-bold transition-all",
                                isSelected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary/10"
                              )}
                              onClick={() => {
                                const current = field.value || [];
                                const next = isSelected 
                                  ? current.filter(d => d !== day.value)
                                  : [...current, day.value];
                                field.onChange(next);
                              }}
                            >
                              {day.label}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>

                {/* Horários */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="promoSchedule.startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] uppercase font-bold text-muted-foreground">Início</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="h-9" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="promoSchedule.endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] uppercase font-bold text-muted-foreground">Fim</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="h-9" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="min-w-[140px] bg-primary hover:bg-primary/90"
            >
              {isPending ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TagIcon className="mr-2 h-4 w-4" />
              )}
              Salvar Regras
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

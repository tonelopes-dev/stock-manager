"use client";

import { adjustIngredientStock } from "@/app/_actions/ingredient/adjust-ingredient-stock";
import {
  adjustIngredientStockSchema,
  AdjustIngredientStockSchema,
} from "@/app/_actions/ingredient/adjust-ingredient-stock/schema";
import { Button } from "@/app/_components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface AdjustStockDialogContentProps {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  unitLabel: string;
  setDialogIsOpen: Dispatch<SetStateAction<boolean>>;
}

const AdjustStockDialogContent = ({
  ingredientId,
  ingredientName,
  currentStock,
  unitLabel,
  setDialogIsOpen,
}: AdjustStockDialogContentProps) => {
  const { execute: executeAdjust } = useAction(adjustIngredientStock, {
    onSuccess: () => {
      toast.success("Estoque ajustado com sucesso.");
      setDialogIsOpen(false);
    },
    onError: ({ error: { serverError, validationErrors } }) => {
      const firstError = validationErrors?._errors?.[0] || serverError;
      toast.error(firstError || "Ocorreu um erro ao ajustar o estoque.");
    },
  });

  const form = useForm<AdjustIngredientStockSchema>({
    resolver: zodResolver(adjustIngredientStockSchema),
    defaultValues: {
      id: ingredientId,
      quantity: 0,
      reason: "",
    },
  });

  const watchQuantity = form.watch("quantity");
  const newStock = currentStock + (watchQuantity || 0);

  const onSubmit = (data: AdjustIngredientStockSchema) => {
    executeAdjust(data);
  };

  return (
    <DialogContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              Ajuste o estoque de <strong>{ingredientName}</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Current Stock (read-only) */}
          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Estoque atual
            </p>
            <p className="text-2xl font-bold">
              {currentStock} <span className="text-sm font-normal text-muted-foreground">{unitLabel}</span>
            </p>
          </div>

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Positivo = entrada, Negativo = saída"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Compra de fornecedor, Perda, Inventário..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preview */}
          {watchQuantity !== 0 && (
            <div className="rounded-lg border p-4 bg-primary/5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Novo estoque após ajuste
              </p>
              <p className={`text-2xl font-bold ${newStock < 0 ? "text-destructive" : "text-primary"}`}>
                {newStock} <span className="text-sm font-normal text-muted-foreground">{unitLabel}</span>
              </p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" type="reset">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || watchQuantity === 0}
              className="gap-1.5"
            >
              {form.formState.isSubmitting && (
                <Loader2Icon className="animate-spin" size={16} />
              )}
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default AdjustStockDialogContent;

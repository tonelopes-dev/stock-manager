"use client";

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
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { formatQuantity } from "@/app/_lib/format-quantity";
import { z } from "zod";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";

// Generic schema since both actions use the same structure
const adjustSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().refine((val) => val !== 0, {
    message: "A quantidade deve ser diferente de zero.",
  }),
  reason: z.string().trim().min(3, {
    message: "O motivo deve ter pelo menos 3 caracteres.",
  }),
});

type AdjustSchema = z.infer<typeof adjustSchema>;

interface AdjustStockDialogContentProps {
  itemId: string;
  itemName: string;
  currentStock: number;
  baseUnit: string;
  setDialogIsOpen: Dispatch<SetStateAction<boolean>>;
  adjustAction: any; // The server action
}

const UNIT_LABELS: Record<string, string> = {
  G: "g",
  KG: "kg",
  ML: "ml",
  L: "L",
  UN: "Un",
  PCT: "pct",
  MC: "mç",
};

const AdjustStockDialogContent = ({
  itemId,
  itemName,
  currentStock,
  baseUnit,
  setDialogIsOpen,
  adjustAction,
}: AdjustStockDialogContentProps) => {
  const router = useRouter();
  const [displayUnit, setDisplayUnit] = useState(baseUnit);

  // Sync display unit when baseUnit changes (e.g., dialog opens for different product)
  useEffect(() => {
    if (baseUnit) {
      setDisplayUnit(baseUnit);
    }
  }, [baseUnit]);

  const { execute: executeAdjust, isPending } = useAction(adjustAction, {
    onSuccess: () => {
      toast.success("Estoque ajustado com sucesso.");
      router.refresh();
      setDialogIsOpen(false);
    },
    onError: ({ error: { serverError, validationErrors } }) => {
      const firstError = (validationErrors as any)?._errors?.[0] || serverError;
      toast.error(firstError || "Ocorreu um erro ao ajustar o estoque.");
    },
  });

  const form = useForm<AdjustSchema>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      id: itemId,
      quantity: 0,
      reason: "",
    },
  });

  const watchValue = form.watch("quantity");

  const multiplier = useMemo(() => {
    if (baseUnit === "G" && displayUnit === "KG") return 1000;
    if (baseUnit === "ML" && displayUnit === "L") return 1000;
    if (baseUnit === "KG" && displayUnit === "G") return 0.001;
    if (baseUnit === "L" && displayUnit === "ML") return 0.001;
    return 1;
  }, [baseUnit, displayUnit]);

  const calculatedQuantity = (watchValue || 0) * multiplier;
  const newStock = currentStock + calculatedQuantity;

  const unitOptions = useMemo(() => {
    if (baseUnit === "G" || baseUnit === "KG") {
      return [
        { value: "G", label: "Gramas (g)" },
        { value: "KG", label: "Quilos (kg)" },
      ];
    }
    if (baseUnit === "ML" || baseUnit === "L") {
      return [
        { value: "ML", label: "Mililitros (ml)" },
        { value: "L", label: "Litros (L)" },
      ];
    }
    return [{ value: baseUnit, label: `${UNIT_LABELS[baseUnit] || baseUnit}` }];
  }, [baseUnit]);

  const onSubmit = (data: AdjustSchema) => {
    executeAdjust({
      ...data,
      quantity: data.quantity * multiplier,
    });
  };

  return (
    <DialogContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              Ajuste o estoque de <strong>{itemName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Estoque atual
            </p>
            <p className="text-2xl font-bold">
              {formatQuantity(currentStock, UNIT_LABELS[baseUnit] || baseUnit)}
            </p>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Valor"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        className="flex-1"
                      />
                    </FormControl>
                    <Select
                      value={displayUnit}
                      onValueChange={setDisplayUnit}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {multiplier !== 1 && watchValue !== 0 && (
                    <p className="text-xs text-primary font-medium mt-1">
                      Equivale a{" "}
                      {formatQuantity(
                        calculatedQuantity,
                        UNIT_LABELS[baseUnit] || baseUnit
                      )}{" "}
                      no sistema
                    </p>
                  )}
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
                      placeholder="Ex: Compra, Perda, Inventário..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {watchValue !== 0 && (
            <div className="rounded-lg border p-4 bg-primary/5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Novo estoque após ajuste
              </p>
              <p
                className={`text-2xl font-bold ${
                  newStock < 0 ? "text-destructive" : "text-primary"
                }`}
              >
                {formatQuantity(newStock, UNIT_LABELS[baseUnit] || baseUnit)}
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
              disabled={isPending || watchValue === 0}
              className="gap-1.5"
            >
              {isPending && (
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

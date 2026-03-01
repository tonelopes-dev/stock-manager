"use client";

import { upsertGoal } from "@/app/_actions/goal/upsert-goal";
import {
  upsertGoalSchema,
  UpsertGoalSchema,
} from "@/app/_actions/goal/upsert-goal/schema";
import { Button } from "@/app/_components/ui/button";
import {
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Textarea } from "@/app/_components/ui/textarea";
import { Combobox } from "@/app/_components/ui/combobox";
import { GoalDto } from "@/app/_data-access/goal/get-goals";
import { format } from "date-fns";

interface UpsertGoalDialogContentProps {
  goal?: GoalDto;
  products: { id: string; name: string }[];
  onClose: () => void;
}

export const UpsertGoalDialogContent = ({
  goal,
  products,
  onClose,
}: UpsertGoalDialogContentProps) => {
  const { execute: executeUpsertGoal } = useAction(upsertGoal, {
    onSuccess: () => {
      const isCreate = !goal;
      toast.success(`Meta ${isCreate ? "criada" : "atualizada"} com sucesso.`);
      onClose();
    },
    onError: ({ error: { serverError, validationErrors } }) => {
      const firstError = validationErrors?._errors?.[0] || serverError;
      toast.error(firstError || "Ocorreu um erro ao salvar a meta.");
    },
  });

  const form = useForm<UpsertGoalSchema>({
    resolver: zodResolver(upsertGoalSchema),
    defaultValues: goal
      ? {
          id: goal.id,
          name: goal.name,
          description: goal.description || "",
          type: goal.type,
          period: goal.period,
          targetValue: Number(goal.targetValue),
          productId: goal.productId || "",
          startDate: new Date(goal.startDate),
          endDate: goal.endDate ? new Date(goal.endDate) : undefined,
        }
      : {
          name: "",
          description: "",
          type: "GLOBAL",
          period: "MONTHLY",
          targetValue: 0,
          productId: "",
          startDate: new Date(),
        },
  });

  const onSubmit = (data: UpsertGoalSchema) => {
    executeUpsertGoal(data);
  };

  const isEditing = !!goal;
  const goalType = form.watch("type");

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <DialogContent className="sm:max-w-[425px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar" : "Criar"} Meta</DialogTitle>
            <DialogDescription>
              Defina os objetivos de vendas para sua empresa.
            </DialogDescription>
          </DialogHeader>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Meta</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Meta de Vendas Julho" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GLOBAL">Global</SelectItem>
                      <SelectItem value="PRODUCT">Produto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DAILY">Diário</SelectItem>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="targetValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Alvo (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {goalType === "PRODUCT" && (
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto</FormLabel>
                    <FormControl>
                      <Combobox
                        options={productOptions}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Selecionar..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Início</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value ? format(field.value, "yyyy-MM-dd") : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fim (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value ? format(field.value, "yyyy-MM-dd") : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Notas sobre esta meta..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="gap-1.5"
            >
              {form.formState.isSubmitting && (
                <Loader2Icon className="animate-spin" size={16} />
              )}
              {isEditing ? "Salvar Alterações" : "Criar Meta"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

"use client";

import { upsertIngredient } from "@/app/_actions/ingredient/upsert-ingredient";
import {
  upsertIngredientSchema,
  UpsertIngredientSchema,
} from "@/app/_actions/ingredient/upsert-ingredient/schema";
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
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { toast } from "sonner";
import * as React from "react";

const MoneyInput = React.forwardRef<HTMLInputElement, NumericFormatProps>(
  (props, ref) => {
    return <NumericFormat {...props} getInputRef={ref} />;
  },
);
MoneyInput.displayName = "MoneyInput";

const UNIT_OPTIONS = [
  { value: "KG", label: "Quilograma (Kg)" },
  { value: "G", label: "Grama (g)" },
  { value: "L", label: "Litro (L)" },
  { value: "ML", label: "Mililitro (ml)" },
  { value: "UN", label: "Unidade (Un)" },
];

interface UpsertIngredientDialogContentProps {
  defaultValues?: UpsertIngredientSchema;
  setDialogIsOpen: Dispatch<SetStateAction<boolean>>;
}

const UpsertIngredientDialogContent = ({
  defaultValues,
  setDialogIsOpen,
}: UpsertIngredientDialogContentProps) => {
  const { execute: executeUpsertIngredient } = useAction(upsertIngredient, {
    onSuccess: () => {
      toast.success("Insumo salvo com sucesso.");
      setDialogIsOpen(false);
    },
    onError: ({ error: { serverError, validationErrors } }) => {
      const firstError = validationErrors?._errors?.[0] || serverError;
      toast.error(firstError || "Ocorreu um erro ao salvar o insumo.");
    },
  });

  const form = useForm<UpsertIngredientSchema>({
    shouldUnregister: true,
    resolver: zodResolver(upsertIngredientSchema),
    defaultValues: defaultValues ?? {
      name: "",
      unit: "KG",
      cost: 0,
      stock: 0,
      minStock: 0,
    },
  });

  const onSubmit = (data: UpsertIngredientSchema) => {
    executeUpsertIngredient({ ...data, id: defaultValues?.id });
  };

  const isEditing = !!defaultValues;

  return (
    <DialogContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar" : "Novo"} insumo</DialogTitle>
            <DialogDescription>Insira as informações do insumo</DialogDescription>
          </DialogHeader>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Carne bovina, Cachaça, Limão..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade de medida</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditing && (
                  <p className="text-[10px] text-muted-foreground">
                    A unidade não pode ser alterada após a criação.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo unitário</FormLabel>
                  <FormControl>
                    <MoneyInput
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={4}
                      prefix="R$ "
                      allowNegative={false}
                      customInput={Input}
                      onValueChange={(values) =>
                        field.onChange(values.floatValue ?? 0)
                      }
                      name={field.name}
                      onBlur={field.onBlur}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque Mínimo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Alerta de estoque baixo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {!isEditing && (
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque Inicial</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Quantidade inicial em estoque"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" type="reset">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="gap-1.5"
            >
              {form.formState.isSubmitting && (
                <Loader2Icon className="animate-spin" size={16} />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertIngredientDialogContent;

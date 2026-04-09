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
import { Loader2Icon, CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { toast } from "sonner";
import * as React from "react";
import { Switch } from "@/app/_components/ui/switch";
import { Label } from "@/app/_components/ui/label";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { ExpirationReminder } from "./expiration-reminder";

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

const UnitSelectorField = ({
  label,
  field,
  baseUnit,
  disabled,
  testId,
}: {
  label: string;
  field: any;
  baseUnit: string;
  disabled?: boolean;
  testId?: string;
}) => {
  const [displayUnit, setDisplayUnit] = React.useState(baseUnit);

  // Sync displayUnit if baseUnit changes
  React.useEffect(() => {
    setDisplayUnit(baseUnit);
  }, [baseUnit]);

  const multiplier = React.useMemo(() => {
    if (baseUnit === "G" && displayUnit === "KG") return 1000;
    if (baseUnit === "ML" && displayUnit === "L") return 1000;
    if (baseUnit === "KG" && displayUnit === "G") return 0.001;
    if (baseUnit === "L" && displayUnit === "ML") return 0.001;
    return 1;
  }, [baseUnit, displayUnit]);

  const unitOptions = React.useMemo(() => {
    if (baseUnit === "G" || baseUnit === "KG") {
      return [
        { value: "G", label: "g" },
        { value: "KG", label: "kg" },
      ];
    }
    if (baseUnit === "ML" || baseUnit === "L") {
      return [
        { value: "ML", label: "ml" },
        { value: "L", label: "L" },
      ];
    }
    return [{ value: "UN", label: "un" }];
  }, [baseUnit]);

  // Use a ref to avoid infinite loops if needed, but field.value is the source of truth
  const displayValue = field.value !== undefined ? field.value / multiplier : "";

  return (
    <FormItem>
      <FormLabel htmlFor={testId}>{label}</FormLabel>
      <div className="flex gap-2">
            <Input
              id={testId}
              name={field.name}
              aria-label={label}
              type="number"
              step="any"
              value={displayValue}
              data-testid={`field-${field.name}`}
              disabled={disabled}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                field.onChange(isNaN(val) ? 0 : val * multiplier);
              }}
              className="flex-1"
            />
        <Select
          value={displayUnit}
          onValueChange={setDisplayUnit}
          disabled={disabled}
        >
          <SelectTrigger className="w-[80px]" data-testid={`unit-select-${field.name}`}>
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
      <FormMessage />
    </FormItem>
  );
};

const UpsertIngredientDialogContent = ({
  defaultValues,
  setDialogIsOpen,
}: UpsertIngredientDialogContentProps) => {
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    // Small delay to ensure Radix/Next hydration is settled
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
    defaultValues: defaultValues ? {
      ...defaultValues,
      expirationDate: defaultValues.expirationDate ? new Date(defaultValues.expirationDate) : undefined,
      expirationReminderDate: defaultValues.expirationReminderDate ? new Date(defaultValues.expirationReminderDate) : undefined,
    } : {
      name: "",
      unit: "KG",
      cost: 0,
      stock: 0,
      minStock: 0,
      trackExpiration: false,
      expirationReminderDate: undefined,
    },
  });

  const onSubmit = (data: UpsertIngredientSchema) => {
    executeUpsertIngredient({ ...data, id: defaultValues?.id });
  };

  const isEditing = !!defaultValues;

  return (
    <DialogContent data-testid="upsert-ingredient-dialog" data-ready={isReady}>
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
                <FormLabel htmlFor="ingredient-name-input">Nome</FormLabel>
                <Input 
                  id="ingredient-name-input"
                  data-testid="upsert-ingredient-name-input"
                  aria-label="Nome do Insumo"
                  placeholder="Ex: Carne bovina, Cachaça, Limão..." 
                  {...field} 
                />
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
                  <FormLabel htmlFor="ingredient-cost-input">Custo unitário</FormLabel>
                  <MoneyInput
                    id="ingredient-cost-input"
                    aria-label="Custo Unitário do Insumo"
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={4}
                    prefix="R$ "
                    allowNegative={false}
                    customInput={Input}
                    disabled={isEditing}
                    className={isEditing ? "bg-muted" : ""}
                    onValueChange={(values) =>
                      field.onChange(values.floatValue ?? 0)
                    }
                    name={field.name}
                    onBlur={field.onBlur}
                    value={field.value}
                  />
                  {isEditing && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      O custo unitário é atualizado automaticamente por Compras.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <UnitSelectorField
                  label="Estoque Mínimo"
                  field={field}
                  baseUnit={form.watch("unit")}
                  testId="ingredient-min-stock-input"
                />
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <>
                <UnitSelectorField
                  label="Estoque Atual"
                  field={field}
                  baseUnit={form.watch("unit")}
                  disabled={isEditing}
                  testId="ingredient-stock-input"
                />
                {isEditing && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    O estoque é atualizado por Compras, Produção ou Ajustes Manuais.
                  </p>
                )}
              </>
            )}
          />

          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Controle de Validade</Label>
                <p className="text-[10px] text-muted-foreground">
                  Ative para ser alertado sobre o vencimento deste insumo.
                </p>
              </div>
              <FormField
                control={form.control}
                name="trackExpiration"
                render={({ field }) => (
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          form.setValue("expirationDate", undefined);
                          form.setValue("expirationReminderDate", undefined);
                        }
                      }}
                    />
                  </FormControl>
                )}
              />
            </div>

            {form.watch("trackExpiration") && (
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Validade</FormLabel>
                    <FormControl>
                      <ExpirationReminder
                        value={field.value}
                        onChange={(date) => {
                          field.onChange(date);
                          form.setValue("expirationReminderDate", date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

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

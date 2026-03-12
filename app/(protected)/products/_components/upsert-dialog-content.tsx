"use client";

import { upsertProduct } from "@/app/_actions/product/upsert-product";
import {
  upsertProductSchema,
  UpsertProductSchema,
} from "@/app/_actions/product/upsert-product/schema";
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
import { Badge } from "@/app/_components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, X, ChevronsUpDown, Check } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { toast } from "sonner";
import * as React from "react";
import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";

const MoneyInput = React.forwardRef<HTMLInputElement, NumericFormatProps>(
  (props, ref) => {
    return <NumericFormat {...props} getInputRef={ref} />;
  },
);
MoneyInput.displayName = "MoneyInput";

interface UpsertProductDialogContentProps {
  defaultValues?: UpsertProductSchema;
  setDialogIsOpen: Dispatch<SetStateAction<boolean>>;
  hasProducts?: boolean;
  categories: ProductCategoryOption[];
}

const UpsertProductDialogContent = ({
  defaultValues,
  setDialogIsOpen,
  categories,
}: UpsertProductDialogContentProps) => {
  const { execute: executeUpsertProduct, isPending } = useAction(
    upsertProduct,
    {
      onSuccess: () => {
        const isCreate = !defaultValues;

        toast.success(
          `Produto ${isCreate ? "criado" : "atualizado"} com sucesso.`,
        );

        setDialogIsOpen(false);
      },
      onError: ({ error: { serverError, validationErrors } }) => {
        const firstError = validationErrors?._errors?.[0] || serverError;
        toast.error(firstError || "Ocorreu um erro ao salvar o produto.");
      },
    },
  );
  const form = useForm<UpsertProductSchema>({
    shouldUnregister: true,
    resolver: zodResolver(upsertProductSchema),
    defaultValues: defaultValues ?? {
      id: "",
      name: "",
      type: "RESELL",
      price: 0,
      cost: 0,
      sku: "",
      stock: 1,
      minStock: 0,
      categoryIds: [],
    },
  });

  const productType = form.watch("type");
  const isPrepared = productType === "PREPARED";

  const onSubmit = (data: UpsertProductSchema) => {
    executeUpsertProduct({ ...data, id: defaultValues?.id });
  };

  const isEditing = !!defaultValues;

  return (
    <DialogContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar" : "Criar"} produto</DialogTitle>
            <DialogDescription>Insira as informações abaixo</DialogDescription>
          </DialogHeader>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome do produto" {...field} />
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
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RESELL">Revenda</SelectItem>
                      <SelectItem value="PREPARED">Produção Própria</SelectItem>
                    </SelectContent>
                  </Select>
                  {isEditing && (
                    <p className="text-[10px] text-muted-foreground">
                      O tipo não pode ser alterado após a criação.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o SKU do produto"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço</FormLabel>
                  <FormControl>
                    <MoneyInput
                      thousandSeparator="."
                      decimalSeparator=","
                      fixedDecimalScale
                      decimalScale={2}
                      prefix="R$ "
                      allowNegative={false}
                      customInput={Input}
                      onValueChange={(values) =>
                        field.onChange(values.floatValue)
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

            {!isPrepared && (
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo</FormLabel>
                    <FormControl>
                      <MoneyInput
                        thousandSeparator="."
                        decimalSeparator=","
                        fixedDecimalScale
                        decimalScale={2}
                        prefix="R$ "
                        allowNegative={false}
                        customInput={Input}
                        onValueChange={(values) =>
                          field.onChange(values.floatValue)
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
            )}

            {isPrepared && (
              <div className="flex items-end">
                <p className="pb-2 text-xs text-muted-foreground">
                  O custo será calculado automaticamente com base na receita.
                </p>
              </div>
            )}
          </div>

          {!isPrepared && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Atual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Quantidade atual"
                        {...field}
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
                        placeholder="Alerta de estoque baixo"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Category MultiSelect */}
          {categories.length > 0 && (
            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => {
                const selected = field.value || [];
                return (
                  <FormItem>
                    <FormLabel>Categorias</FormLabel>
                    <div className="space-y-2">
                      {selected.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selected.map((catId: string) => {
                            const cat = categories.find((c) => c.id === catId);
                            if (!cat) return null;
                            return (
                              <Badge
                                key={catId}
                                variant="secondary"
                                className="gap-1 rounded-lg px-2.5 py-1 text-xs font-bold"
                              >
                                {cat.name}
                                <button
                                  type="button"
                                  onClick={() =>
                                    field.onChange(
                                      selected.filter(
                                        (id: string) => id !== catId,
                                      ),
                                    )
                                  }
                                  className="ml-0.5 rounded-full p-0.5 hover:bg-slate-300/50"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            type="button"
                            className="w-full justify-between text-sm font-normal text-muted-foreground"
                          >
                            {selected.length === 0
                              ? "Selecionar categorias..."
                              : `${selected.length} selecionada(s)`}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-2">
                          <div className="space-y-1">
                            {categories.map((cat) => {
                              const isSelected = selected.includes(cat.id);
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      field.onChange(
                                        selected.filter(
                                          (id: string) => id !== cat.id,
                                        ),
                                      );
                                    } else {
                                      field.onChange([...selected, cat.id]);
                                    }
                                  }}
                                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                    isSelected
                                      ? "bg-primary/10 font-semibold text-primary"
                                      : "hover:bg-slate-100"
                                  }`}
                                >
                                  <div
                                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                                      isSelected
                                        ? "border-primary bg-primary"
                                        : "border-slate-300"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  {cat.name}
                                </button>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

          {isPrepared && (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4">
              <p className="text-center text-sm text-muted-foreground">
                Após criar o produto, acesse a página de detalhes para cadastrar
                a receita com os insumos.
              </p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" type="reset">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending} className="gap-1.5">
              {isPending && <Loader2Icon className="animate-spin" size={16} />}
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertProductDialogContent;

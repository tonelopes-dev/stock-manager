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
  Dialog,
  DialogContent as SubDialogContent,
  DialogHeader as SubDialogHeader,
  DialogTitle as SubDialogTitle,
  DialogFooter as SubDialogFooter,
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
import { Loader2Icon, X, ChevronsUpDown, Check, CalendarIcon, ImageIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { toast } from "sonner";
import * as React from "react";
import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";
import { UnitType } from "@prisma/client";
import { Switch } from "@/app/_components/ui/switch";
import { Label } from "@/app/_components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/app/_lib/utils";
import { Calendar } from "@/app/_components/ui/calendar";
import { upsertCategory } from "@/app/_actions/product/upsert-category";
import { PlusIcon } from "lucide-react";

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

const UnitSelectorField = ({
  label,
  field,
  baseUnit,
  disabled,
}: {
  label: string;
  field: any;
  baseUnit: string;
  disabled?: boolean;
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

  const displayValue = field.value !== undefined ? field.value / multiplier : "";

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="flex gap-2">
        <FormControl>
          <Input
            type="number"
            step="any"
            value={displayValue}
            disabled={disabled}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              field.onChange(isNaN(val) ? 0 : val * multiplier);
            }}
            className="flex-1"
          />
        </FormControl>
        <Select
          value={displayUnit}
          onValueChange={setDisplayUnit}
          disabled={disabled}
        >
          <SelectTrigger className="w-[80px]">
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

  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);

  const { execute: executeUpsertCategory, isPending: isPendingCategory } =
    useAction(upsertCategory, {
      onSuccess: () => {
        toast.success("Categoria criada com sucesso.");
        setIsAddingCategory(false);
        setNewCategoryName("");
      },
      onError: () => {
        toast.error("Erro ao criar categoria.");
      },
    });

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    executeUpsertCategory({ name: newCategoryName });
  };
  const form = useForm<UpsertProductSchema>({
    shouldUnregister: true,
    resolver: zodResolver(upsertProductSchema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      expirationDate: defaultValues.expirationDate ? new Date(defaultValues.expirationDate) : undefined,
    } : {
      id: "",
      name: "",
      type: "RESELL",
      unit: UnitType.UN,
      price: 0,
      cost: 0,
      sku: "",
      stock: 1,
      minStock: 0,
      categoryId: "",
      trackExpiration: false,
    },
  });

  const productType = form.watch("type");
  const isPrepared = productType === "PREPARED";

  const isEditing = !!defaultValues;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const response = await fetch(`/api/upload?filename=${file.name}`, {
        method: "POST",
        body: file,
      });

      if (!response.ok) throw new Error("Upload failed");

      const blob = await response.json();
      form.setValue("imageUrl", blob.url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data: UpsertProductSchema) => {
    executeUpsertProduct({ ...data, id: defaultValues?.id });
  };

  return (
    <DialogContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar" : "Criar"} produto</DialogTitle>
            <DialogDescription>Insira as informações abaixo</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1 max-h-[60vh] space-y-5 py-2">
            <div className="flex items-start gap-4">
              <div className="flex-1">
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
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem</FormLabel>
                    <FormControl>
                      <div className="relative w-24 h-24">
                        {field.value ? (
                          <div className="relative w-full h-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 group shadow-sm transition-all hover:border-slate-300">
                            <img
                              src={field.value}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full shadow-lg"
                                onClick={() => field.onChange("")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <label
                            className={cn(
                              "flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer transition-all hover:border-slate-300 hover:bg-slate-100 shadow-sm text-slate-400 group",
                              isUploading && "cursor-not-allowed opacity-70"
                            )}
                          >
                            {isUploading ? (
                              <Loader2Icon className="h-5 w-5 animate-spin text-slate-500" />
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <ImageIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">Add</span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={isUploading}
                            />
                          </label>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade de Medida</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UnitType.UN}>Unidade (UN)</SelectItem>
                    <SelectItem value={UnitType.G}>Grama (g)</SelectItem>
                    <SelectItem value={UnitType.KG}>Quilograma (kg)</SelectItem>
                    <SelectItem value={UnitType.ML}>Mililitro (ml)</SelectItem>
                    <SelectItem value={UnitType.L}>Litro (L)</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <div className="flex flex-col gap-1">
                    <UnitSelectorField
                      label="Estoque Atual"
                      field={field}
                      baseUnit={form.watch("unit")}
                      disabled={isEditing}
                    />
                    {isEditing && (
                      <p className="text-[10px] text-muted-foreground">
                        Para alterar o estoque de um produto existente, utilize
                        a opção &quot;Ajustar Estoque&quot; no menu de ações.
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-4 rounded-lg border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Controle de Validade</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Ative para ser alertado sobre o vencimento deste produto.
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date: Date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>


          {/* Category Select - ALWAYS VISIBLE */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Categoria</FormLabel>
                </div>
                <div className="flex gap-2">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                    key={categories.length} // Force re-render when a new category is added
                  >
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          Nenhuma categoria cadastrada.
                        </div>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddingCategory(true)}
                    className="shrink-0"
                    title="Adicionar nova categoria"
                  >
                    <PlusIcon size={18} />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sub-modal for creating category */}
          <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
            <SubDialogContent className="sm:max-w-[425px]">
              <SubDialogHeader>
                <SubDialogTitle>Nova Categoria</SubDialogTitle>
              </SubDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <FormLabel>Nome da Categoria</FormLabel>
                  <Input
                    placeholder="Ex: Bebidas, Sobremesas..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <SubDialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => setIsAddingCategory(false)}
                  disabled={isPendingCategory}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateCategory}
                  disabled={isPendingCategory || !newCategoryName.trim()}
                >
                  {isPendingCategory && (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Criar Categoria
                </Button>
              </SubDialogFooter>
            </SubDialogContent>
          </Dialog>

            {isPrepared && (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4">
                <p className="text-center text-sm text-muted-foreground">
                  Após criar o produto, acesse a página de detalhes para cadastrar
                  a receita com os insumos.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" type="reset">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || isUploading} className="gap-1.5">
              {(isPending || isUploading) && <Loader2Icon className="animate-spin" size={16} />}
              {isPending ? "Salvando..." : isUploading ? "Aguarde o upload..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertProductDialogContent;

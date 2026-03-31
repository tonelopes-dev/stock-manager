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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, X, CalendarIcon, ImageIcon, PlusIcon, Trash2Icon, InfoIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
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
import { QuickEnvironmentDialog } from "./quick-environment-dialog";
import { SelectSeparator } from "@/app/_components/ui/select";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { NumericFormat } from "react-number-format";

interface UpsertProductDialogContentProps {
  defaultValues?: UpsertProductSchema;
  setDialogIsOpen: Dispatch<SetStateAction<boolean>>;
  hasProducts?: boolean;
  categories: ProductCategoryOption[];
  environments: EnvironmentOption[];
}

const UpsertProductDialogContent = ({
  defaultValues,
  setDialogIsOpen,
  categories,
  environments,
}: UpsertProductDialogContentProps) => {
  const { execute: executeUpsertProduct, isPending } = useAction(
    upsertProduct,
    {
      onSuccess: () => {
        const isCreate = !defaultValues;
        toast.success(`Produto ${isCreate ? "criado" : "atualizado"} com sucesso.`);
        setDialogIsOpen(false);
      },
      onError: ({ error: { serverError, validationErrors } }) => {
        const firstError = validationErrors?._errors?.[0] || serverError;
        toast.error(firstError || "Ocorreu um erro ao salvar o produto.");
      },
    },
  );

  const [isAddingCategory, setIsAddingCategory] = React.useState(false);
  const [isEnvironmentDialogOpen, setIsEnvironmentDialogOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);

  const { execute: executeUpsertCategory, isPending: isPendingCategory } =
    useAction(upsertCategory, {
      onSuccess: () => {
        toast.success("Categoria criada com sucesso.");
        setIsAddingCategory(false);
        setNewCategoryName("");
      },
      onError: () => toast.error("Erro ao criar categoria."),
    });

  const form = useForm<UpsertProductSchema>({
    resolver: zodResolver(upsertProductSchema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      compositions: undefined,
      expirationDate: defaultValues.expirationDate ? new Date(defaultValues.expirationDate) : undefined,
    } as any : {
      name: "",
      type: "REVENDA",
      unit: UnitType.UN,
      price: 0,
      cost: 0,
      sku: "",
      stock: 0,
      minStock: 0,
      trackExpiration: false,
    },
  });

  const productType = form.watch("type");
  const isCompositionType =
    productType === "COMBO" || productType === "PRODUCAO_PROPRIA";

  const onSubmit = (data: UpsertProductSchema) => {
    executeUpsertProduct({ ...data, id: defaultValues?.id });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const imageCompression = (
        await import("browser-image-compression")
      ).default;
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
      });
      const response = await fetch(
        `/api/upload?filename=${compressedFile.name}`,
        { method: "POST", body: compressedFile }
      );
      if (!response.ok) throw new Error("Upload failed");
      const blob = await response.json();
      form.setValue("imageUrl", blob.url);
      toast.success("Imagem enviada!");
    } catch (error) {
      toast.error("Erro no upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full flex flex-col space-y-6"
        >
          <DialogHeader>
            <DialogTitle>
              {defaultValues ? "Editar" : "Criar"} Produto
            </DialogTitle>
            <DialogDescription>
              Preencha os dados técnicos do item.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1 pr-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: X-Salada, Coca-Cola..."
                          {...field}
                        />
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
                        <FormLabel>Tipo de Produto</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="REVENDA">Revenda</SelectItem>
                            <SelectItem value="PRODUCAO_PROPRIA">
                              Produção Própria
                            </SelectItem>
                            <SelectItem value="COMBO">Combo</SelectItem>
                            <SelectItem value="INSUMO">
                              Insumo / Matéria-prima
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={UnitType.UN}>
                              Unidade (UN)
                            </SelectItem>
                            <SelectItem value={UnitType.KG}>
                              Quilograma (kg)
                            </SelectItem>
                            <SelectItem value={UnitType.G}>
                              Grama (g)
                            </SelectItem>
                            <SelectItem value={UnitType.L}>
                              Litro (L)
                            </SelectItem>
                            <SelectItem value={UnitType.ML}>
                              Mililitro (ml)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Label>Foto</Label>
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted hover:bg-muted/80 transition-colors">
                      {field.value ? (
                        <>
                          <img
                            src={field.value}
                            className="w-full h-full object-cover"
                            alt="Produto"
                          />
                          <button
                            onClick={() => field.onChange("")}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full shadow-md"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-1 text-muted-foreground pt-2">
                          <ImageIcon size={24} />
                          <span className="text-[10px] font-bold">UPLOAD</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                          />
                        </label>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Venda</FormLabel>
                    <FormControl>
                      <NumericFormat
                        customInput={Input}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        onValueChange={(vals) => field.onChange(vals.floatValue)}
                        value={field.value}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo {isCompositionType && "(Auto)"}</FormLabel>
                    <FormControl>
                      <NumericFormat
                        customInput={Input}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        disabled={isCompositionType}
                        onValueChange={(vals) => field.onChange(vals.floatValue)}
                        value={field.value}
                        className={isCompositionType ? "bg-muted font-bold" : ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Inicial</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU / Código</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Opcional"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} value={field.value || undefined} key={categories.length}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={() => setIsAddingCategory(true)}><PlusIcon size={18} /></Button>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="environmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambiente</FormLabel>
                    <Select onValueChange={(val) => val === "create" ? setIsEnvironmentDialogOpen(true) : field.onChange(val === "none" ? null : val)} value={field.value || "none"}>
                      <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">Padrão</SelectItem>
                        {environments.map(env => <SelectItem key={env.id} value={env.id}>{env.name}</SelectItem>)}
                        <SelectSeparator/>
                        <SelectItem value="create" className="text-primary font-bold">Criar novo...</SelectItem>
                      </SelectContent>
                    </Select>
                    <QuickEnvironmentDialog open={isEnvironmentDialogOpen} onOpenChange={setIsEnvironmentDialogOpen} />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={isPending || isUploading} className="min-w-[120px]">
              {(isPending || isUploading) && <Loader2Icon className="mr-2 h-4 w-4 animate-spin"/>}
              {isPending ? "Salvando..." : "Salvar Produto"}
            </Button>
          </DialogFooter>
        </form>
      </Form>

      {/* Category Creation Sub-modal */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <SubDialogContent>
          <SubDialogHeader><SubDialogTitle>Nova Categoria</SubDialogTitle></SubDialogHeader>
          <div className="py-4">
            <Label>Nome da Categoria</Label>
            <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} autoFocus />
          </div>
          <SubDialogFooter>
            <Button variant="outline" onClick={() => setIsAddingCategory(false)}>Cancelar</Button>
            <Button onClick={() => executeUpsertCategory({ name: newCategoryName })} disabled={isPendingCategory}>Criar</Button>
          </SubDialogFooter>
        </SubDialogContent>
      </Dialog>
    </DialogContent>
  );
};

export default UpsertProductDialogContent;

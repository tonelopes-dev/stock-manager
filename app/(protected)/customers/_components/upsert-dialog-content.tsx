"use client";

import { upsertCustomer } from "@/app/_actions/customer/upsert-customer";
import {
  upsertCustomerSchema,
  UpsertCustomerSchema,
} from "@/app/_actions/customer/upsert-customer/schema";
import { Button } from "@/app/_components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog as SubDialog,
  DialogTrigger as SubDialogTrigger,
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
import { MultiSelect } from "@/app/_components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Textarea } from "@/app/_components/ui/textarea";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { upsertCustomerCategory } from "@/app/_actions/customer/upsert-category";
import { upsertCRMStage } from "@/app/_actions/crm/upsert-stage";

interface UpsertCustomerDialogContentProps {
  defaultValues?: UpsertCustomerSchema;
  setDialogIsOpen: Dispatch<SetStateAction<boolean>>;
  categories: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  onSuccess?: (customer: any) => void;
}

const UpsertCustomerDialogContent = ({
  defaultValues,
  setDialogIsOpen,
  categories = [],
  stages = [],
  onSuccess,
}: UpsertCustomerDialogContentProps) => {
  const router = useRouter();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newStageName, setNewStageName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  const { execute: executeUpsertCustomer, isPending } = useAction(
    upsertCustomer,
    {
      onSuccess: ({ data }) => {
        const isCreate = !defaultValues?.id;
        toast.success(
          `Cliente ${isCreate ? "criado" : "atualizado"} com sucesso.`,
        );
        if (onSuccess && data) {
          onSuccess(data);
        }
        setDialogIsOpen(false);
      },
      onError: ({ error: { serverError, validationErrors } }) => {
        if (validationErrors) {
          Object.entries(validationErrors).forEach(([field, errors]) => {
            let message: string | undefined;

            if (Array.isArray(errors) && errors.length > 0) {
              message = errors[0] as string;
            } else if (typeof errors === "object" && errors !== null) {
              const fieldErrors = (errors as any)._errors;
              if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
                message = fieldErrors[0] as string;
              }
            }

            if (message) {
              form.setError(field as any, {
                type: "manual",
                message,
              });
            }
          });
        }

        if (serverError) {
          toast.error(serverError || "Ocorreu um erro ao salvar o cliente.");
        }
      },
    },
  );

  const form = useForm<UpsertCustomerSchema>({
    shouldUnregister: true,
    resolver: zodResolver(upsertCustomerSchema),
    defaultValues: {
      id: defaultValues?.id || "",
      name: defaultValues?.name || "",
      email: defaultValues?.email || "",
      phoneNumber: defaultValues?.phoneNumber || "",
      categoryIds: defaultValues?.categoryIds || [],
      stageId: defaultValues?.stageId || "",
      birthDate: defaultValues?.birthDate || "",
      notes: defaultValues?.notes || "",
    },
  });

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    let formatted = "";

    if (cleaned.length > 0) {
      formatted = "(" + cleaned.slice(0, 2);
      if (cleaned.length > 2) {
        formatted += ") " + cleaned.slice(2, 7);
        if (cleaned.length > 7) {
          formatted += "-" + cleaned.slice(7, 11);
        }
      }
    }

    return formatted;
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    setIsSubmittingQuick(true);
    try {
      const result = await upsertCustomerCategory({ name: newCategoryName });
      if (result?.data) {
        toast.success("Categoria criada!");
        setNewCategoryName("");
        setIsAddingCategory(false);
        router.refresh();
        const currentCats = form.getValues("categoryIds") || [];
        form.setValue("categoryIds", [...currentCats, (result.data as any).id]);
      } else {
        toast.error("Erro ao criar categoria.");
      }
    } catch (error) {
      toast.error("Erro ao criar categoria.");
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const handleAddStage = async () => {
    if (!newStageName) return;
    setIsSubmittingQuick(true);
    try {
      const result = await upsertCRMStage({ name: newStageName });
      if (result?.data) {
        toast.success("Estágio criado!");
        setNewStageName("");
        setIsAddingStage(false);
        router.refresh();
        form.setValue("stageId", (result.data as any).id);
      } else {
        toast.error("Erro ao criar estágio.");
      }
    } catch (error) {
      toast.error("Erro ao criar estágio.");
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const onSubmit = (data: UpsertCustomerSchema) => {
    executeUpsertCustomer({ ...data, id: defaultValues?.id });
  };

  const isEditing = !!defaultValues?.id;

  return (
    <DialogContent className="max-w-2xl sm:max-w-3xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold italic tracking-tighter uppercase">{isEditing ? "Editar" : "Criar Novo"} Cliente</DialogTitle>
            <DialogDescription className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">Insira os dados cadastrais abaixo</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-1">
                    Nome Completo <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do cliente" className="h-10 text-xs font-bold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary/80">E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      className="h-10 text-xs font-bold"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-1">
                    Telefone <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 00000-0000"
                      className="h-10 text-xs font-bold"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary/80">Data de Aniversário</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value ? parseISO(field.value) : undefined}
                      onChange={(date) =>
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                      }
                      showDropdowns={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormField
                control={form.control}
                name="categoryIds"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-1">
                        Categorias <span className="text-destructive">*</span>
                      </FormLabel>
                      <SubDialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
                        <SubDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 gap-1 text-[9px] font-bold uppercase text-primary hover:bg-primary/5">
                            <PlusIcon size={10} /> Novo
                          </Button>
                        </SubDialogTrigger>
                        <DialogContent className="max-w-xs">
                          <DialogHeader>
                            <DialogTitle className="text-sm font-bold uppercase italic">Nova Categoria</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-2">
                            <Input 
                              placeholder="Nome da categoria" 
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                              className="h-9 text-xs font-bold"
                            />
                            <Button 
                              className="w-full h-9" 
                              onClick={handleAddCategory}
                              disabled={isSubmittingQuick || !newCategoryName}
                            >
                              {isSubmittingQuick ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Criar Categoria"}
                            </Button>
                          </div>
                        </DialogContent>
                      </SubDialog>
                    </div>
                    <FormControl>
                      <MultiSelect
                        options={categories}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Selecione as categorias"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="stageId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary/80 flex items-center gap-1">
                        Estágio CRM <span className="text-destructive">*</span>
                      </FormLabel>
                      <SubDialog open={isAddingStage} onOpenChange={setIsAddingStage}>
                        <SubDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 gap-1 text-[9px] font-bold uppercase text-primary hover:bg-primary/5">
                            <PlusIcon size={10} /> Novo
                          </Button>
                        </SubDialogTrigger>
                        <DialogContent className="max-w-xs">
                          <DialogHeader>
                            <DialogTitle className="text-sm font-bold uppercase italic">Novo Estágio CRM</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-2">
                            <Input 
                              placeholder="Nome do estágio" 
                              value={newStageName}
                              onChange={(e) => setNewStageName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
                              className="h-9 text-xs font-bold"
                            />
                            <Button 
                              className="w-full h-9" 
                              onClick={handleAddStage}
                              disabled={isSubmittingQuick || !newStageName}
                            >
                              {isSubmittingQuick ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Criar Estágio"}
                            </Button>
                          </div>
                        </DialogContent>
                      </SubDialog>
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs font-bold">
                          <SelectValue placeholder="Selecione o estágio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id} className="text-xs font-bold">
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary/80">Observações</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Adicione observações sobre o cliente"
                    className="min-h-[80px] text-xs font-bold"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

export default UpsertCustomerDialogContent;

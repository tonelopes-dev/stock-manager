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
import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Textarea } from "@/app/_components/ui/textarea";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { format, parseISO } from "date-fns";

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
  const { execute: executeUpsertCustomer, isPending } = useAction(
    upsertCustomer,
    {
      onSuccess: ({ data }) => {
        const isCreate = !defaultValues;
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
    defaultValues: defaultValues ?? {
      id: "",
      name: "",
      email: "",
      phoneNumber: "",
      categoryIds: [],
      stageId: "",
      birthDate: "",
      notes: "",
    },
  });

  const onSubmit = (data: UpsertCustomerSchema) => {
    executeUpsertCustomer({ ...data, id: defaultValues?.id });
  };

  const isEditing = !!defaultValues;

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
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary/80">Nome Completo</FormLabel>
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
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary/80">Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 00000-0000"
                      className="h-10 text-xs font-bold"
                      {...field}
                      value={field.value || ""}
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
            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary/80">Categorias</FormLabel>
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

            <FormField
              control={form.control}
              name="stageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary/80">Estágio CRM</FormLabel>
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

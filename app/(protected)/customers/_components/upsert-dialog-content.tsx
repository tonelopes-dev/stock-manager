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

interface UpsertCustomerDialogContentProps {
  defaultValues?: UpsertCustomerSchema;
  setDialogIsOpen: Dispatch<SetStateAction<boolean>>;
  categories: { id: string; name: string }[];
  stages: { id: string; name: string }[];
}

const UpsertCustomerDialogContent = ({
  defaultValues,
  setDialogIsOpen,
  categories,
  stages,
}: UpsertCustomerDialogContentProps) => {
  const { execute: executeUpsertCustomer } = useAction(upsertCustomer, {
    onSuccess: () => {
      const isCreate = !defaultValues;
      toast.success(
        `Cliente ${isCreate ? "criado" : "atualizado"} com sucesso.`,
      );
      setDialogIsOpen(false);
    },
    onError: ({ error: { serverError, validationErrors } }) => {
      const firstError = validationErrors?._errors?.[0] || serverError;
      toast.error(firstError || "Ocorreu um erro ao salvar o cliente.");
    },
  });

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
    <DialogContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar" : "Criar"} cliente</DialogTitle>
            <DialogDescription>Insira as informações abaixo</DialogDescription>
          </DialogHeader>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome do cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
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
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 00000-0000"
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
              name="categoryIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorias</FormLabel>
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
                  <FormLabel>Estágio CRM</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estágio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
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
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Aniversário</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Adicione observações sobre o cliente"
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

export default UpsertCustomerDialogContent;

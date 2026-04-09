"use client";

import * as React from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { useAction } from "next-safe-action/hooks";
import { upsertSupplier } from "@/app/_actions/supplier/upsert-supplier";
import { upsertSupplierSchema, UpsertSupplierSchema } from "@/app/_actions/supplier/upsert-supplier/schema";
import { toast } from "sonner";
import { Supplier } from "@prisma/client";

interface UpsertSupplierDialogContentProps {
  setDialogIsOpen: (isOpen: boolean) => void;
  defaultValues?: UpsertSupplierSchema;
}

const UpsertSupplierDialogContent = ({
  setDialogIsOpen,
  defaultValues,
}: UpsertSupplierDialogContentProps) => {
  const form = useForm<UpsertSupplierSchema>({
    resolver: zodResolver(upsertSupplierSchema),
    defaultValues: defaultValues || {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      taxId: "",
    },
  });

  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    // Small delay to ensure Radix/Next hydration is settled
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { execute, isExecuting } = useAction(upsertSupplier, {
    onSuccess: () => {
      toast.success("Fornecedor salvo com sucesso!");
      setDialogIsOpen(false);
    },
    onError: () => {
      toast.error("Erro ao salvar fornecedor.");
    },
  });

  const onSubmit = (data: UpsertSupplierSchema) => {
    execute(data);
  };

  return (
    <DialogContent data-testid="upsert-supplier-dialog" data-ready={isReady} className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{defaultValues ? "Editar" : "Novo"} Fornecedor</DialogTitle>
        <DialogDescription>
          Preencha os dados abaixo para gerenciar seus fornecedores.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Empresa/Vendedor</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Distribuidora de Carnes Silva" 
                    data-testid="upsert-supplier-name-input"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pessoa de Contato</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: João da Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ / CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input placeholder="fornecedor@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isExecuting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isExecuting}>
              {isExecuting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertSupplierDialogContent;

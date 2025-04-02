"use client";
import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { DialogClose, DialogHeader } from "@/app/_components/ui/dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/app/_components/ui/dialog";
import { Loader2, PlusIcon } from "lucide-react";
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
import { NumericFormat } from "react-number-format";
import {
  createProduct,
  CreateProductSchema,
} from "@/app/_actions/product/create-product";
import { createProductSchema } from "@/app/_actions/product/create-product/schema";
import { toast } from "sonner";

const CreateProductButton = () => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const form = useForm<CreateProductSchema>({
    shouldUnregister: true,
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      price: 0,
      stock: 1,
    },
  });

  const onSubmit = async (data: CreateProductSchema) => {
    try {
      await createProduct(data);
      setDialogIsOpen(false);
      toast.success("Produto cadastrado com sucesso!");
    } catch (e) {
      console.log(e);
      toast.error("Erro ao cadastrar produto!");
    }
  };
  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusIcon size={20} />
          Novo Produto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Produto</DialogTitle>
              <DialogDescription>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor</FormLabel>
                          <FormControl>
                            <NumericFormat
                              thousandSeparator="."
                              decimalSeparator=","
                              fixedDecimalScale
                              decimalScale={2}
                              {...field}
                              prefix="R$ "
                              allowNegative={false}
                              customInput={Input}
                              onValueChange={(values) =>
                                field.onChange(values.floatValue)
                              }
                              onChange={() => {}}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-4">
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
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    )}
                    Salvar
                  </Button>
                </div>
              </DialogDescription>
            </DialogHeader>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProductButton;

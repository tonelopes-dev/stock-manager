"use client";
import { z } from "zod";

import { Button } from "@/app/_components/ui/button";
import { DialogClose, DialogHeader } from "@/app/_components/ui/dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/app/_components/ui/dialog";
import { PlusIcon } from "lucide-react";
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

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório").trim(),
  price: z
    .number({
      invalid_type_error: "Digite um número válido",
      required_error: "O valor é obrigatório",
    })
    .min(0.01, "O valor é obrigatório"),
  stock: z.coerce
    .number({
      invalid_type_error: "Digite um número válido",
      required_error: "O estoque é obrigatório",
    })
    .positive({ message: "O estoque não pode ser zero ou negativo" })
    .min(1, "O estoque é obrigatório"),
});

type FormData = z.infer<typeof formSchema>;
const AddProductButton = () => {
  const form = useForm<FormData>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      stock: 1,
    },
  });

  const onSubmit = (data: FormData) => console.log(data);
  return (
    <Dialog>
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

                  <Button type="submit">Salvar</Button>
                </div>
              </DialogDescription>
            </DialogHeader>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductButton;

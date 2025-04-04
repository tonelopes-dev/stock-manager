"use client";
import { Button } from "@/app/_components/ui/button";
import { DialogHeader } from "@/app/_components/ui/dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/app/_components/ui/form";
import {
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/app/_components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Input } from "@/app/_components/ui/input";
import { NumericFormat } from "react-number-format";
import { Form } from "@/app/_components/ui/form";
import {
  UpsertProductSchema,
  upsertProduct,
} from "@/app/_actions/product/upsert-product";
import { toast } from "sonner";
import { upsertProductSchema } from "@/app/_actions/product/upsert-product/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface UpsertProductDialogContentProps {
  defaultValues?: UpsertProductSchema;
  onSucess?: () => void;
}

const UpsertProductDialogContent = ({
  defaultValues,
  onSucess,
}: UpsertProductDialogContentProps) => {
  const form = useForm<UpsertProductSchema>({
    shouldUnregister: true,
    resolver: zodResolver(upsertProductSchema),
    defaultValues: defaultValues ?? {
      name: "",
      price: 0,
      stock: 1,
    },
  });
  const isEditing = !!defaultValues;
  const onSubmit = async (data: UpsertProductSchema) => {
    try {
      await upsertProduct({ ...data, id: defaultValues?.id });
      onSucess?.();
      toast.success("Produto cadastrado com sucesso!");
    } catch (e) {
      console.log(e);
      toast.error("Erro ao cadastrar produto!");
    }
  };
  return (
    <DialogContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar" : "Novo"} Produto</DialogTitle>
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
  );
};

export default UpsertProductDialogContent;

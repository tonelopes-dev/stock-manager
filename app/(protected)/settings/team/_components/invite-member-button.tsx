"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { inviteMember } from "@/app/_actions/user/invite-member";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Button } from "@/app/_components/ui/button";
import { PlusIcon, Loader2Icon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email("E-mail inválido"),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
});

type FormValues = z.infer<typeof formSchema>;

const InviteMemberButton = () => {
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "EMPLOYEE",
    },
  });

  const { execute, isPending } = useAction(inviteMember, {
    onSuccess: () => {
      toast.success("Convite enviado com sucesso!");
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao enviar convite.");
    },
  });

  const onSubmit = (values: FormValues) => {
    execute(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold gap-2">
          <PlusIcon size={18} />
          Convidar Membro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <UserPlusIcon size={24} />
          </div>
          <DialogTitle className="text-2xl font-black">Convidar para a equipe</DialogTitle>
          <DialogDescription>
            Envie um convite por e-mail para que outra pessoa possa acessar o Stockly da sua empresa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">E-mail do convidado</FormLabel>
                  <FormControl>
                    <Input placeholder="exemplo@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Papel (Permissões)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um papel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Membro (Operacional)</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="font-bold min-w-[120px]">
                {isPending ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Enviar Convite"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberButton;

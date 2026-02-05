"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { inviteUserViaWhatsApp } from "@/app/_actions/user/invite-whatsapp";
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
import { PlusIcon, Loader2Icon, UserPlusIcon, MessageCircleIcon, CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { UserRole } from "@prisma/client";

const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido (mínimo 10 dígitos)"),
  role: z.nativeEnum(UserRole),
});

type FormValues = z.infer<typeof formSchema>;

const InviteMemberButton = () => {
  const [open, setOpen] = useState(false);
  const [invitationResult, setInvitationResult] = useState<{ whatsappUrl: string; tempPass: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: UserRole.MEMBER,
    },
  });

  const { execute, isPending } = useAction(inviteUserViaWhatsApp, {
    onSuccess: (data) => {
      if (data.data?.success && data.data?.whatsappUrl) {
        setInvitationResult({
            whatsappUrl: data.data.whatsappUrl,
            tempPass: data.data.tempPassword || ""
        });
        toast.success("Credenciais geradas com sucesso!");
      }
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao gerar convite.");
    },
  });

  const onSubmit = (values: FormValues) => {
    execute(values);
  };

  const handleClose = () => {
    setOpen(false);
    setInvitationResult(null);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!val) handleClose();
        else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button className="font-black gap-2 h-11">
          <PlusIcon size={18} />
          Convidar Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {!invitationResult ? (
          <>
            <DialogHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <UserPlusIcon size={24} />
              </div>
              <DialogTitle className="text-2xl font-black">Convidar para a equipe</DialogTitle>
              <DialogDescription>
                Informe os dados do colaborador. Geraremos uma senha temporária para acesso imediato via WhatsApp.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do colaborador" {...field} />
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
                        <FormLabel className="font-bold">E-mail</FormLabel>
                        <FormControl>
                            <Input placeholder="ex@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="font-bold">WhatsApp (DDI+DDD)</FormLabel>
                        <FormControl>
                            <Input placeholder="5511999999999" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

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
                          <SelectItem value={UserRole.MEMBER}>Membro (Operacional)</SelectItem>
                          <SelectItem value={UserRole.ADMIN}>Administrador (Gestão)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={handleClose} className="font-bold">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending} className="font-black px-8">
                    {isPending ? (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Gerar Acesso"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          <div className="py-6 text-center space-y-6">
             <div className="flex justify-center">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                    <CheckCircle2Icon size={40} />
                </div>
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900">Acesso Criado!</h3>
                <p className="text-sm text-slate-500 mt-2">
                    As credenciais foram registradas. Agora, envie o convite para o colaborador via WhatsApp.
                </p>
             </div>

             <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Credenciais Geradas</p>
                <div className="space-y-1">
                    <p className="text-sm text-slate-900"><strong className="text-slate-400">Login:</strong> {form.getValues("email")}</p>
                    <p className="text-sm text-slate-900"><strong className="text-slate-400">Senha:</strong> {invitationResult.tempPass}</p>
                </div>
             </div>

             <Button 
                className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-black h-12 gap-2"
                onClick={() => {
                    window.open(invitationResult.whatsappUrl, "_blank");
                    handleClose();
                }}
             >
                <MessageCircleIcon size={20} />
                Enviar via WhatsApp
             </Button>

             <p className="text-[10px] text-slate-400">
                O colaborador será obrigado a trocar a senha ao entrar.
             </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberButton;

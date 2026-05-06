
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { acceptInviteAction } from "@/app/_actions/company/invite/accept-invitation";
import { acceptInviteSchema, type AcceptInviteSchema } from "@/app/_actions/company/invite/schema";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { toast } from "sonner";
import { Loader2Icon, LockIcon, MailIcon, CheckCircle2Icon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AcceptInviteFormProps {
  token: string;
  email: string;
  companyName: string;
}

export function AcceptInviteForm({ token, email, companyName }: AcceptInviteFormProps) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const form = useForm<AcceptInviteSchema>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const { execute, isPending } = useAction(acceptInviteAction, {
    onSuccess: () => {
      setSuccess(true);
      toast.success("Convite aceito com sucesso!");
      setTimeout(() => router.push("/login"), 3000);
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao processar convite.");
    },
  });

  const onSubmit = (values: AcceptInviteSchema) => {
    execute(values);
  };

  if (success) {
    return (
      <Card className="border-none shadow-2xl bg-background/60 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
        <CardContent className="pt-12 pb-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2Icon size={48} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Tudo Pronto!</h2>
            <p className="text-muted-foreground">
              Você agora faz parte da equipe <strong>{companyName}</strong>.
            </p>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            Redirecionando para o login em instantes...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-2xl bg-background/60 backdrop-blur-xl overflow-hidden">
      <div className="h-2 bg-primary w-full" />
      <CardHeader className="pt-8 pb-4 text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
          <LockIcon size={24} />
        </div>
        <CardTitle className="text-3xl font-black tracking-tight">Configurar Acesso</CardTitle>
        <CardDescription className="text-base">
          <strong>{companyName}</strong> convidou você para a equipe.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 pb-8 space-y-6">
        <div className="p-4 bg-muted/50 rounded-xl border border-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center text-muted-foreground">
            <MailIcon size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">E-mail de Acesso</p>
            <p className="text-sm font-bold">{email}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Nova Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full h-12 font-black text-lg mt-4">
              {isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                "Aceitar Convite"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

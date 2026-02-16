"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { toast } from "sonner";
import { Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Deve conter pelo menos um número"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

import { Suspense } from "react";

function ResetPasswordForm() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async () => {
    if (!token) {
        toast.error("Token de redefinição ausente ou inválido.");
        return;
    }

    setIsPending(true);
    try {
      // Simulate server action for reset
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Senha redefinida com sucesso! Você já pode fazer login.");
      router.push("/login");
    } catch (error) {
      toast.error("Erro ao redefinir senha. O token pode ter expirado.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
               <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <ShieldCheckIcon size={32} />
               </div>
          </div>
          <CardTitle className="text-2xl font-black text-center">Criar nova senha</CardTitle>
          <CardDescription className="text-center">
            Escolha uma senha forte e segura que você ainda não tenha usado nesta conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                        Min. 8 caracteres, maiúsculas e números.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending || !token} className="w-full font-black h-12">
                {isPending ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPending ? "Redefinindo..." : "Redefinir senha"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Suspense fallback={
        <Card className="w-full max-w-md border-slate-200 shadow-xl">
           <CardContent className="p-10 flex flex-col items-center justify-center space-y-4">
              <Loader2Icon className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Carregando...</p>
           </CardContent>
        </Card>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

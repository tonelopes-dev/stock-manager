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
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/_components/ui/card";
import { toast } from "sonner";
import { Loader2Icon, MailIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isPending, setIsPending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsPending(true);
    try {
      // Simulate server action for recovery
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSent(true);
      toast.success("Se o e-mail existir, um link de recuperação foi enviado.");
    } catch (error) {
      toast.error("Erro ao solicitar recuperação.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md border-slate-200 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
               <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <MailIcon size={32} />
               </div>
          </div>
          <CardTitle className="text-2xl font-black text-center">Esqueceu a senha?</CardTitle>
          <CardDescription className="text-center">
            Não se preocupe! Informe seu e-mail e enviaremos instruções para você criar uma nova.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSent ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">E-mail cadastrado</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending} className="w-full font-black h-12">
                  {isPending ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isPending ? "Processando..." : "Enviar instruções"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-sm text-emerald-800 font-medium">
                    Instruções enviadas! Verifique sua caixa de entrada (e a pasta de spam).
                </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
            <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-2">
                <ArrowLeftIcon size={14} />
                Voltar para o login
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

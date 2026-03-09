"use server";

import { auth } from "@/app/_lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { AlertCircle } from "lucide-react";
import { RestoreButton } from "./_components/restore-button";

export default async function RestoreCompanyPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only Owner should see this page (Middleware already guards this, but being extra safe)
  if (session.user.role !== "OWNER") {
    redirect("/dashboard");
  }

  // If company is NOT deleted, why are you here?
  if (!session.user.companyDeletedAt) {
    redirect("/dashboard");
  }

  const deletionDate = new Date(session.user.companyDeletedAt);
  const gracePeriodEnd = new Date(deletionDate);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Card className="max-w-md border-destructive/50 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-fit rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Empresa Desativada</CardTitle>
          <CardDescription>
            Esta empresa foi marcada para exclusão e está em período de
            carência.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            A exclusão permanente e a limpeza dos dados ocorrerão em:
            <br />
            <span className="font-bold text-foreground">
              {gracePeriodEnd.toLocaleDateString("pt-BR", {
                dateStyle: "long",
              })}
            </span>
          </p>
          <div className="space-y-2 rounded-lg bg-muted p-4 text-left text-xs">
            <p>• O acesso para membros e administradores está bloqueado.</p>
            <p>
              • Suas vendas, produtos e dados financeiros estão preservados.
            </p>
            <p>
              • A assinatura foi configurada para ser encerrada ao fim do
              período atual.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <RestoreButton />
          <Button variant="ghost" className="w-full" asChild>
            <a href="/login">Voltar para o Login</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

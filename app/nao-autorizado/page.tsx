import Link from "next/link";
import { ShieldXIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

export default function NaoAutorizadoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4 text-center">
      <div className="space-y-6 animate-in fade-in zoom-in duration-500 max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-destructive/10 blur-xl animate-pulse" />
            <div className="relative bg-background rounded-full p-6 shadow-xl">
              <ShieldXIcon className="h-16 w-16 text-destructive" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-foreground">
            Acesso Negado
          </h1>
          <h2 className="text-xl font-semibold text-muted-foreground">
            Você não tem permissão para acessar esta área
          </h2>
          <p className="text-muted-foreground text-sm">
            Se você acredita que deveria ter acesso, entre em contato com o
            administrador da sua empresa para que ele conceda a permissão
            necessária.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-2">
          <Button asChild>
            <Link href="/dashboard">Voltar ao Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile">Meu Perfil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

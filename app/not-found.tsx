import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { PackageIcon, GhostIcon, ArrowLeftIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="relative">
             <div className="absolute -inset-4 rounded-full bg-primary/10 blur-xl animate-pulse" />
             <div className="relative bg-white rounded-full p-6 shadow-xl">
                <GhostIcon className="h-16 w-16 text-primary" />
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tighter text-slate-900">404</h1>
          <h2 className="text-2xl font-bold text-slate-700">Página não encontrada</h2>
          <p className="text-slate-500 max-w-xs mx-auto">
            Opa! Parece que esse item não está no nosso estoque de páginas.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" variant="default" className="h-12 px-8 font-bold" asChild>
            <Link href="/dashboard">
              <ArrowLeftIcon className="mr-2 h-5 w-5" />
              Voltar ao Início
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 font-bold" asChild>
            <Link href="/login">Fazer Login</Link>
          </Button>
        </div>

        <div className="pt-12 flex items-center justify-center gap-2 grayscale opacity-30">
            <PackageIcon className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold tracking-tight text-primary">STOCKY</span>
        </div>
      </div>
    </div>
  );
}

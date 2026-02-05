import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { CheckCircle2Icon, RocketIcon, ShieldCheckIcon, ZapIcon, ArrowRightIcon } from "lucide-react";
import { ConfettiCelebration } from "./_components/confetti-celebration";

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center">
      <ConfettiCelebration />
      
      <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="relative">
             <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-blue-600 blur opacity-25 animate-pulse" />
             <div className="relative bg-white rounded-full p-4 shadow-2xl">
                <CheckCircle2Icon className="h-16 w-16 text-green-500" />
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Você agora é Pro! 🚀
          </h1>
          <p className="text-xl text-slate-600">
            Obrigado por confiar no Stockly para fazer seu negócio crescer.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 shadow-sm">
          <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-400">
            O que você liberou agora:
          </h3>
          <ul className="space-y-4 text-left">
            <li className="flex items-center gap-3 text-slate-700 font-medium">
              <ZapIcon className="h-5 w-5 text-primary fill-primary" />
              <span>Produtos ilimitados no estoque</span>
            </li>
            <li className="flex items-center gap-3 text-slate-700 font-medium">
              <ShieldCheckIcon className="h-5 w-5 text-primary fill-primary" />
              <span>Alertas inteligentes de reposição</span>
            </li>
            <li className="flex items-center gap-3 text-slate-700 font-medium">
              <RocketIcon className="h-5 w-5 text-primary fill-primary" />
              <span>Relatórios avançados de lucro</span>
            </li>
          </ul>
        </div>

        <div className="pt-4 flex flex-col gap-4">
          <Button size="lg" className="h-14 w-full text-lg font-bold shadow-xl shadow-primary/20" asChild>
            <Link href="/dashboard">
              Ir para o Dashboard
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-sm text-slate-400 italic">
            "Seu negócio merece essa organização"
          </p>
        </div>
      </div>
    </div>
  );
}

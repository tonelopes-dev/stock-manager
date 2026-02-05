import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { PackageIcon, ShieldCheckIcon, BarChart3Icon, TrendingUpIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stockly — Controle de estoque inteligente para sua empresa",
  description: "Recupere o controle da sua loja. Dashboard em tempo real, gestão de SKUs e limites automáticos. Simples, rápido e feito para crescer.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* HEADER */}
      <header className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <PackageIcon className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-primary">STOCKLY</span>
          </div>
          <nav className="hidden space-x-8 text-sm font-medium md:flex text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Preços</a>
            <a href="#about" className="hover:text-primary transition-colors">Sobre</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:underline text-muted-foreground">Entrar</Link>
            <Button asChild>
              <Link href="/register">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 md:text-7xl">
                Pare de perder dinheiro com <span className="text-primary italic">planilhas confusas</span>
              </h1>
              <p className="mb-10 text-xl text-muted-foreground md:text-2xl max-w-2xl mx-auto">
                Assuma o controle total do seu estoque hoje. Simples, rápido e inteligente. Feito para empresas que não têm tempo a perder.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="h-14 px-8 text-lg" asChild>
                  <Link href="/register">Registrar meu Estoque Grátis</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Sem cartão necessário • Teste o Pro quando quiser
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-24 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 bg-primary/5 blur-[120px] rounded-full" />
        </section>

        {/* PAIN POINTS SECTION */}
        <section id="features" className="bg-gray-50 py-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Por que o Stockly?</h2>
              <p className="text-muted-foreground">Resolvendo os problemas reais do seu dia a dia.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: BarChart3Icon,
                  title: "Visibilidade Total",
                  description: "Esqueça a dúvida de 'quanto temos em estoque?'. Dashboard em tempo real para decisões rápidas."
                },
                {
                  icon: ShieldCheckIcon,
                  title: "Adeus Erros Manuais",
                  description: "Pare de confiar apenas na memória ou em anotações de papel. Registro auditável de cada movimentação."
                },
                {
                  icon: TrendingUpIcon,
                  title: "Escalabilidade",
                  description: "Cresça sem medo. De 20 a 1000 produtos, nosso sistema acompanha o ritmo da sua empresa."
                }
              ].map((feature, i) => (
                <div key={i} className="rounded-2xl border bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-white shadow-2xl">
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="mb-6 text-3xl font-bold md:text-4xl">Pronto para profissionalizar sua gestão?</h2>
                <p className="mb-10 text-lg text-white/80">
                  Cadastre-se agora e comece a ver onde seu dinheiro está investido em menos de 2 minutos.
                </p>
                <Button size="lg" variant="secondary" className="h-14 px-10 text-lg shadow-lg" asChild>
                  <Link href="/register">
                    Começar Agora — É Grátis
                  </Link>
                </Button>
              </div>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center md:px-8">
          <div className="flex items-center justify-center gap-2 mb-4 grayscale opacity-50">
            <PackageIcon className="h-5 w-5" />
            <span className="text-lg font-bold tracking-tight">STOCKLY</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Stockly — Gestão inteligente para empresas em crescimento.
          </p>
        </div>
      </footer>
    </div>
  );
}

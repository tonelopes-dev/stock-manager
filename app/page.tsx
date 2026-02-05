import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { 
  PackageIcon, 
  CheckCircle2Icon, 
  XCircleIcon,
  ArrowRightIcon,
  ZapIcon,
  ClockIcon,
  DollarSignIcon
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stockly — Controle de estoque inteligente para sua empresa",
  description: "Recupere o controle da sua loja. Dashboard em tempo real, gestão de SKUs e limites automáticos. Simples, rápido e feito para crescer.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* HEADER */}
      <header className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <PackageIcon className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-primary">STOCKLY</span>
          </div>
          <nav className="hidden space-x-8 text-sm font-medium md:flex text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Dores</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">Como Funciona</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Preços</a>
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
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 md:text-7xl">
                Pare de perder dinheiro com <span className="text-primary italic">estoque desorganizado</span>
              </h1>
              <p className="mb-10 text-xl text-slate-600 md:text-2xl max-w-2xl mx-auto leading-relaxed">
                Assuma o controle total do seu negócio hoje. O Stockly substitui planilhas confusas por um sistema inteligente que avisa quando comprar e o que vender mais.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="h-14 px-8 text-lg font-semibold shadow-lg shadow-primary/20" asChild>
                  <Link href="/register">
                    Registrar meu Estoque Grátis
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-slate-500 font-medium">
                Sem cartão necessário • Configure em menos de 2 minutos
              </p>
            </div>
          </div>
          <div className="absolute -bottom-24 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 bg-primary/5 blur-[120px] rounded-full" />
        </section>

        {/* PAIN POINTS SECTION */}
        <section id="features" className="py-24 bg-slate-50 border-y border-slate-200">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">Parece familiar?</h2>
              <p className="text-slate-600 max-w-xl mx-auto italic">&ldquo;Achei que ainda tinha esse item no estoque...&rdquo;</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: XCircleIcon,
                  title: "Vendas Perdidas",
                  description: "Você só descobre que o produto acabou quando o cliente pede e ele não está lá na prateleira.",
                  color: "text-red-500 bg-red-50"
                },
                {
                  icon: ClockIcon,
                  title: "Horas em Planilhas",
                  description: "Você gasta parte do seu dia atualizando tabelas manuais que nunca batem com a realidade física.",
                  color: "text-amber-500 bg-amber-50"
                },
                {
                  icon: DollarSignIcon,
                  title: "Dinheiro Parado",
                  description: "Você não faz ideia de quanto capital tem investido em mercadorias que estão pegando poeira.",
                  color: "text-blue-500 bg-blue-50"
                }
              ].map((feature, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                  <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">Simples, como deve ser</h2>
              <p className="text-slate-600">Do cadastro à venda em menos de 2 minutos.</p>
            </div>
            <div className="grid gap-12 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Cadastre",
                  description: "Adicione seus produtos e o que tem hoje na prateleira em segundos."
                },
                {
                  step: "02",
                  title: "Registre",
                  description: "Marque suas vendas pelo celular ou computador. O estoque baixa sozinho."
                },
                {
                  step: "03",
                  title: "Lucre",
                  description: "Receba alertas de estoque baixo e relatórios automáticos de onde vem seu lucro."
                }
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-black shadow-lg shadow-primary/30">
                    {item.step}
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">{item.title}</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    {item.description}
                  </p>
                  {i < 2 && (
                    <div className="absolute top-8 left-[calc(50%+4rem)] hidden w-[calc(100%-8rem)] border-t-2 border-dashed border-slate-200 lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">Planos para o seu momento</h2>
              <p className="text-slate-600">Transparência total, sem taxas escondidas.</p>
            </div>
            <div className="grid max-w-5xl mx-auto gap-8 md:grid-cols-2">
              {/* FREE PLAN */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Gratuito</h3>
                  <p className="text-slate-500 text-sm">Para quem está começando agora.</p>
                </div>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">R$ 0</span>
                  <span className="text-slate-500">/mês</span>
                </div>
                <ul className="mb-8 space-y-4 flex-1">
                  {[
                    "Até 20 produtos",
                    "Vendas ilimitadas",
                    "Dashboard em tempo real",
                    "Suporte via e-mail"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-600">
                      <CheckCircle2Icon className="h-5 w-5 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full h-12" asChild>
                  <Link href="/register">Começar Grátis</Link>
                </Button>
              </div>

              {/* PRO PLAN */}
              <div className="rounded-3xl border-2 border-primary bg-white p-8 shadow-xl flex flex-col relative overflow-hidden scale-105">
                <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                  POPULAR
                </div>
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Plano Pro</h3>
                  <p className="text-slate-500 text-sm">Para empresas em crescimento.</p>
                </div>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">R$ 49</span>
                  <span className="text-slate-500">/mês</span>
                </div>
                <ul className="mb-8 space-y-4 flex-1">
                  {[
                    "Produtos ilimitados",
                    "Relatórios de lucro avançados",
                    "Alertas automáticos de estoque",
                    "Suporte prioritário via WhatsApp",
                    "Exportação de dados (CSV/PDF)"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-900 font-medium">
                      <ZapIcon className="h-5 w-5 text-primary fill-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full h-12 shadow-lg shadow-primary/30" asChild>
                  <Link href="/register">Assinar Agora</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 px-8 py-20 text-center text-white shadow-2xl">
              <div className="relative z-10 mx-auto max-w-3xl text-center">
                <h2 className="mb-6 text-4xl font-bold md:text-5xl">Chega de planilhas. Comece a gerenciar seu lucro de verdade.</h2>
                <p className="mb-10 text-xl text-slate-300 leading-relaxed">
                  Junte-se a lojistas que recuperaram 10h por semana e pararam de perder vendas por falta de estoque.
                </p>
                <div className="flex flex-col items-center gap-4">
                  <Button size="lg" variant="secondary" className="h-16 px-12 text-xl font-bold text-slate-900 shadow-xl hover:scale-105 transition-transform" asChild>
                    <Link href="/register">
                      Criar minha conta gratuita agora
                    </Link>
                  </Button>
                  <p className="text-sm text-slate-500">Resultados imediatos no seu primeiro login.</p>
                </div>
              </div>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2">
                <PackageIcon className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold tracking-tight text-slate-900">STOCKLY</span>
              </div>
              <p className="text-sm text-slate-500 text-center md:text-left max-w-xs">
                Gestão inteligente para empresas que não têm tempo a perder. Feito com ❤️ para o pequeno empreendedor.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
                <div className="flex flex-col gap-4">
                  <h4 className="font-bold text-slate-900">Produto</h4>
                  <a href="#features" className="text-slate-500 hover:text-primary transition-colors">Dores</a>
                  <a href="#how-it-works" className="text-slate-500 hover:text-primary transition-colors">Como Funciona</a>
                  <a href="#pricing" className="text-slate-500 hover:text-primary transition-colors">Preços</a>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="font-bold text-slate-900">Suporte</h4>
                  <a href="mailto:ajuda@stockly.com.br" className="text-slate-500 hover:text-primary transition-colors">E-mail</a>
                  <a href="#" className="text-slate-500 hover:text-primary transition-colors">FAQ</a>
                </div>
            </div>
          </div>
          <div className="mt-16 border-t border-slate-100 pt-8 text-center text-sm text-slate-400">
            © 2026 Stockly — Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

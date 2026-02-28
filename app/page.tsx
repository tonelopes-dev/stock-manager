import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import {
  Package2,
  CheckCircle2,
  ArrowRight,
  ShoppingCart,
  History,
  Smartphone,
  Zap,
  MessageCircle,
  AlertCircle,
  Table2,
  DollarSign,
  UserCog,
  Shield,
} from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stockly | Controle Executivo de Estoque",
  description:
    "O sistema de gestão de estoque feito para quem não tem tempo a perder com planilhas. Tudo automático, rápido e seguro.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white selection:bg-primary/10 selection:text-primary">
      {/* HEADER */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-slate-900 p-1.5 shadow-lg">
              <Package2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter text-slate-900">
              Stockly
            </span>
          </div>
          <div className="hidden items-center gap-10 text-sm font-bold text-slate-500 md:flex">
            <a
              className="transition-colors hover:text-slate-900"
              href="#problem"
            >
              O Problema
            </a>
            <a
              className="transition-colors hover:text-slate-900"
              href="#solutions"
            >
              Diferenciais
            </a>
            <a
              className="transition-colors hover:text-slate-900"
              href="#how-it-works"
            >
              Como Funciona
            </a>
            <a
              className="transition-colors hover:text-slate-900"
              href="#pricing"
            >
              Preços
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Button
              className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold transition-all hover:-translate-y-[1px] hover:shadow-xl active:translate-y-[0]"
              asChild
            >
              <Link href="/register">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden px-6 pb-32 pt-44">
          <div className="hero-glow absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2" />
          <div className="relative mx-auto max-w-5xl text-center">
            <span className="mb-8 inline-block rounded-full border border-slate-200 bg-slate-100/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 backdrop-blur-sm">
              FEITO PARA QUEM VENDE TODO DIA
            </span>

            <h1 className="mb-8 text-5xl font-[900] leading-[0.95] tracking-tight text-slate-900 sm:text-6xl md:text-[88px]">
              Controle seu estoque sem planilhas e venda{" "}
              <span className="text-gradient">muito mais.</span>
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-lg font-medium leading-relaxed text-slate-600 sm:text-xl">
              Registre produtos, acompanhe vendas e saiba exatamente o que
              comprar.
              <br className="hidden md:block" />
              <span className="font-black text-slate-900">
                Teste grátis por 30 dias. Sem cartão necessário.
              </span>
            </p>

            <div className="mb-24 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <Button
                className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-10 py-5 text-base font-black transition-all hover:scale-[1.03] hover:shadow-2xl sm:h-auto sm:w-auto"
                size="lg"
                asChild
              >
                <Link href="/register">
                  Começar teste grátis <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <button className="w-full rounded-full border border-slate-200 bg-white/50 px-10 py-5 text-base font-bold backdrop-blur-sm transition-colors hover:bg-white sm:w-auto">
                <a href="#how-it-works">Ver como funciona</a>
              </button>
            </div>

            {/* Dashboard Preview */}
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute -right-12 -top-12 -z-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 -z-10 h-32 w-32 rounded-full bg-slate-500/10 blur-3xl" />
              <div className="absolute -top-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                SIMULAÇÃO REAL DO SISTEMA
              </div>
              <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] sm:p-12">
                <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
                  <div className="text-left">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      VENDAS HOJE
                    </p>
                    <p className="text-3xl font-black tracking-tighter text-slate-900 sm:text-4xl">
                      R$ 1.250
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      ITENS BAIXOS
                    </p>
                    <p className="text-3xl font-black tracking-tighter text-red-500 sm:text-4xl">
                      08 itens
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      LUCRO LÍQUIDO
                    </p>
                    <p className="text-3xl font-black tracking-tighter text-slate-900 sm:text-4xl">
                      R$ 482
                    </p>
                  </div>
                </div>
                <div className="space-y-5 text-left">
                  <div className="flex items-center justify-between border-b border-slate-50 py-5">
                    <div className="flex items-center gap-5">
                      <span className="text-sm font-black text-slate-200">
                        #1
                      </span>
                      <div>
                        <p className="text-base font-bold text-slate-800">
                          Brownie de Nutella
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Estoque: 12 unid
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-red-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-600">
                      CRÍTICO
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-5">
                    <div className="flex items-center gap-5">
                      <span className="text-sm font-black text-slate-200">
                        #2
                      </span>
                      <div>
                        <p className="text-base font-bold text-slate-800">
                          Suco de Amora 500ml
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Estoque: 05 unid
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-red-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-600">
                      CRÍTICO
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              SEM RENOVAÇÃO AUTOMÁTICA • ATIVE EM 2 MINUTOS
            </p>
          </div>
        </section>

        {/* PROBLEM SECTION — Timeline Layout */}
        <section
          id="problem"
          className="relative overflow-hidden bg-slate-50 px-6 py-32"
        >
          <div className="dot-grid absolute inset-0 opacity-30" />
          <div className="relative mx-auto max-w-6xl">
            <h2 className="mb-32 text-center text-4xl font-black text-slate-900 md:text-6xl">
              Se isso acontece com você, o Stockly resolve.
            </h2>
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="timeline-line absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 md:block" />

              <div className="space-y-24 md:space-y-0">
                {/* Problem 1 — Right */}
                <div className="relative grid items-center gap-8 md:grid-cols-2">
                  <div className="relative pr-0 md:pr-16 md:text-right">
                    <h4 className="text-2xl font-black italic text-red-500">
                      Cenário Antigo
                    </h4>
                    <p className="font-bold text-slate-500">
                      Vendas perdidas no escuro.
                    </p>
                    <div className="absolute right-0 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 translate-x-[calc(50%+4rem)] items-center justify-center rounded-full border border-slate-100 bg-white shadow-2xl md:flex">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                  <div className="md:pl-16">
                    <div className="glass-card rounded-[2.5rem] p-10 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
                      <h4 className="mb-4 text-2xl font-black text-slate-900">
                        Produto acaba sem aviso
                      </h4>
                      <p className="text-base font-medium leading-relaxed text-slate-500">
                        Você perde vendas valiosas porque não sabia que o
                        estoque tinha acabado. Frustração para o cliente e
                        prejuízo para você.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Problem 2 — Left */}
                <div className="relative grid items-center gap-8 md:mt-32 md:grid-cols-2">
                  <div className="order-2 md:order-1 md:pr-16">
                    <div className="glass-card rounded-[2.5rem] p-10 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
                      <h4 className="mb-4 text-2xl font-black text-slate-900">
                        Planilhas desatualizadas
                      </h4>
                      <p className="text-base font-medium leading-relaxed text-slate-500">
                        O controle manual toma horas do seu dia, cansa sua
                        equipe e gera erros constantes que sabotam seu
                        crescimento.
                      </p>
                    </div>
                  </div>
                  <div className="relative order-1 md:order-2 md:pl-16">
                    <h4 className="text-2xl font-black italic text-amber-500">
                      Gargalo Operacional
                    </h4>
                    <p className="font-bold text-slate-500">
                      Caos em planilhas.
                    </p>
                    <div className="absolute left-0 top-1/2 z-10 hidden h-12 w-12 -translate-x-[calc(50%+4rem)] -translate-y-1/2 items-center justify-center rounded-full border border-slate-100 bg-white shadow-2xl md:flex">
                      <Table2 className="h-6 w-6 text-amber-500" />
                    </div>
                  </div>
                </div>

                {/* Problem 3 — Right */}
                <div className="relative grid items-center gap-8 md:mt-32 md:grid-cols-2">
                  <div className="relative pr-0 md:pr-16 md:text-right">
                    <h4 className="text-2xl font-black italic text-blue-600">
                      Capital Preso
                    </h4>
                    <p className="font-bold text-slate-500">
                      Dinheiro parado na prateleira.
                    </p>
                    <div className="absolute right-0 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 translate-x-[calc(50%+4rem)] items-center justify-center rounded-full border border-slate-100 bg-white shadow-2xl md:flex">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="md:pl-16">
                    <div className="glass-card rounded-[2.5rem] p-10 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
                      <h4 className="mb-4 text-2xl font-black text-slate-900">
                        Dinheiro parado
                      </h4>
                      <p className="text-base font-medium leading-relaxed text-slate-500">
                        Você compra mercadoria no escuro, sem saber o que
                        realmente sai e o que fica ocupando espaço e capital de
                        giro.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTIONS SECTION */}
        <section id="solutions" className="px-6 py-40">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-24 lg:flex-row">
            {/* Visual */}
            <div className="flex-1">
              <div className="relative flex aspect-square flex-col justify-center gap-8 rounded-[60px] bg-slate-100/50 p-8 sm:p-16">
                <div className="tilt-3d flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] sm:p-8">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="rounded-xl bg-green-50 p-2.5 text-green-500 sm:p-3">
                      <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <span className="text-base font-black sm:text-lg">
                      Venda: Brownie
                    </span>
                  </div>
                  <span className="text-lg font-black text-green-600 sm:text-xl">
                    + R$ 18
                  </span>
                </div>
                <div className="tilt-3d-reverse flex translate-x-4 items-center justify-between rounded-3xl border border-white/40 bg-white/80 p-6 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] backdrop-blur-md sm:translate-x-12 sm:p-8">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="rounded-xl bg-blue-50 p-2.5 text-blue-500 sm:p-3">
                      <Package2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <span className="font-bold text-slate-400">
                      Estoque atualizado
                    </span>
                  </div>
                  <span className="text-lg font-black text-red-500 sm:text-xl">
                    - 1 unid
                  </span>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 space-y-12">
              <span className="rounded-full bg-blue-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.3em] text-blue-600">
                SUA EMPRESA ORGANIZADA
              </span>
              <h2 className="text-4xl font-black leading-[0.95] text-slate-900 sm:text-5xl md:text-6xl">
                Matenha o controle total sem esforço.
              </h2>
              <div className="space-y-10">
                {[
                  {
                    title: "Controle automático",
                    text: "O estoque atualiza sozinho em tempo real cada vez que você registra uma venda no sistema.",
                  },
                  {
                    title: "Visão clara do negócio",
                    text: "Saiba quais produtos são os seus favoritos e onde está o seu maior lucro com dashboards executivos.",
                  },
                  {
                    title: "Organização simples",
                    text: "Tudo o que você precisa em uma tela limpa, desenhada para ser rápida e sem fricção para a equipe.",
                  },
                ].map((item, i) => (
                  <div key={i} className="group flex gap-6">
                    <CheckCircle2 className="h-7 w-7 shrink-0 text-green-500 sm:h-8 sm:w-8" />
                    <div>
                      <h4 className="mb-2 text-xl font-black text-slate-900">
                        {item.title}
                      </h4>
                      <p className="text-base font-medium leading-relaxed text-slate-500">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="relative overflow-hidden bg-slate-950 px-6 py-40 text-white"
        >
          <div className="relative z-10 mx-auto max-w-7xl">
            <div className="mb-32 text-center">
              <h2 className="mb-8 text-5xl font-[900] tracking-tighter md:text-7xl">
                Simples de usar.
              </h2>
              <p className="mx-auto max-w-2xl text-xl font-medium text-slate-400">
                Três passos para nunca mais perder o controle e escalar sua
                operação.
              </p>
            </div>
            <div className="grid gap-20 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Cadastre",
                  text: "Adicione seus produtos em minutos, configurando níveis mínimos para alertas automáticos e inteligentes.",
                },
                {
                  step: "02",
                  title: "Registre vendas",
                  text: "A cada venda, o sistema automaticamente baixa o estoque físico. Sem intervenção manual ou planilhas.",
                },
                {
                  step: "03",
                  title: "Receba alertas",
                  text: "O sistema te avisa quando comprar, evitando faltas ou excesso de estoque que imobiliza seu capital.",
                },
              ].map((item, i) => (
                <div key={i} className="group text-center">
                  <div className="mb-8 text-8xl font-black text-white/5 transition-colors group-hover:text-blue-500/10">
                    {item.step}
                  </div>
                  <h4 className="mb-4 text-3xl font-black">{item.title}</h4>
                  <p className="text-base font-medium leading-relaxed text-slate-400">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <section className="relative overflow-hidden px-6 py-40">
          <div className="dot-grid absolute inset-0 opacity-20" />
          <div className="relative mx-auto max-w-7xl">
            <h2 className="mb-24 text-center text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Segurança para quem depende do negócio.
            </h2>
            <div className="grid gap-10 md:grid-cols-3">
              {[
                {
                  icon: History,
                  title: "Histórico completo",
                  text: "Veja tudo o que foi alterado, por quem e em que momento. Rastreabilidade total para auditoria.",
                },
                {
                  icon: UserCog,
                  title: "Controle de acesso",
                  text: "Cadastre sua equipe com permissões específicas. Você decide exatamente o que cada um pode ver ou editar.",
                },
                {
                  icon: Shield,
                  title: "Proteção de dados",
                  text: "Suas informações estão criptografadas e salvas na nuvem com backups diários e segurança bancária.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-[2.5rem] border border-slate-100 bg-white p-12 shadow-sm transition-all hover:shadow-xl"
                >
                  <item.icon className="mb-8 h-10 w-10 text-slate-900" />
                  <h4 className="mb-4 text-xl font-black">{item.title}</h4>
                  <p className="text-base font-medium leading-relaxed text-slate-500">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="bg-slate-50/50 px-6 py-40">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-5xl font-black tracking-tighter text-slate-900 md:text-7xl">
              Invista no controle do seu negócio.
            </h2>
            <p className="mb-20 text-xl font-medium text-slate-500">
              Setup único + assinatura mensal. Sem surpresas, sem taxa
              escondida.
            </p>

            <div className="glass-card relative mx-auto max-w-[600px] overflow-hidden rounded-[3rem] p-10 text-left shadow-[0_50px_100px_-15px_rgba(0,0,0,0.1)] sm:p-16">
              <div className="mb-10 flex items-start justify-between">
                <div>
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.25em] text-blue-600">
                    PLANO PROFISSIONAL
                  </span>
                  <h3 className="text-xl font-black uppercase leading-tight tracking-tight text-slate-900">
                    TUDO INCLUSO PARA SUA OPERAÇÃO
                  </h3>
                </div>
                <span className="rounded-full bg-slate-900 px-4 py-2 text-[10px] font-black tracking-widest text-white">
                  MELHOR VALOR
                </span>
              </div>

              {/* Pricing Grid */}
              <div className="mb-8 grid grid-cols-2 gap-6 rounded-2xl bg-slate-50 p-6">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    IMPLEMENTAÇÃO
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-[900] italic tracking-tighter text-slate-900 sm:text-4xl">
                      R$ 4.500
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    Pagamento único
                  </p>
                </div>
                <div className="border-l border-slate-200 pl-6">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    ASSINATURA
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-[900] italic tracking-tighter text-slate-900 sm:text-4xl">
                      R$ 290
                    </span>
                    <span className="ml-1 text-lg font-bold text-slate-400">
                      /mês
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-slate-400">
                    Recorrente
                  </p>
                </div>
              </div>

              <p className="mb-10 text-[12px] font-black uppercase tracking-[0.2em] text-green-600">
                TESTE GRÁTIS POR 30 DIAS
              </p>

              <ul className="mb-12 space-y-5">
                {[
                  "Configuração completa + treinamento",
                  "Produtos e Vendas Ilimitadas",
                  "Dashboards e Relatórios de Lucro",
                  "Alertas Inteligentes de Estoque",
                  "Controle de Acesso (RBAC)",
                  "Histórico e Auditoria Completa",
                  "Suporte Prioritário via WhatsApp",
                  "Price Lock — valor nunca reajustado",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 text-base font-bold text-slate-800"
                  >
                    <Zap className="h-5 w-5 shrink-0 fill-slate-900 text-slate-900" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                className="h-16 w-full rounded-full text-xl font-black transition-all hover:scale-[1.02] hover:shadow-2xl"
                asChild
              >
                <Link href="/register">Começar teste grátis</Link>
              </Button>
              <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                SEM CARTÃO • CANCELE QUANDO QUISER
              </p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden px-6 py-48 text-center">
          <div className="hero-glow absolute left-1/2 top-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-60" />
          <div className="relative mx-auto max-w-4xl">
            <h2 className="mb-12 text-5xl font-black leading-[0.9] tracking-tighter text-slate-900 sm:text-6xl md:text-[88px]">
              Você nunca mais vai perder venda por falta de estoque.
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-2xl font-medium text-slate-500">
              Ative o sistema hoje, automatize sua rotina e tenha a liberdade
              que seu negócio merece.
            </p>
            <Button
              className="mx-auto flex h-auto items-center justify-center gap-4 rounded-full bg-slate-900 px-16 py-6 text-2xl font-black transition-all hover:scale-[1.05] hover:shadow-2xl"
              size="lg"
              asChild
            >
              <Link href="/register">
                Começar teste grátis <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-12 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              <span className="flex items-center gap-3">
                <Zap className="h-5 w-5" /> SETUP RÁPIDO
              </span>
              <span className="flex items-center gap-3">
                <Smartphone className="h-5 w-5" /> MOBILE FIRST
              </span>
              <span className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5" /> SUPORTE REAL
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative border-t border-slate-100 bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-24 grid grid-cols-1 gap-16 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-8 flex items-center gap-2">
                <div className="rounded-lg bg-slate-900 p-1.5 shadow-lg">
                  <Package2 className="h-[18px] w-[18px] text-white" />
                </div>
                <span className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                  Stockly
                </span>
              </div>
              <p className="max-w-sm text-base font-medium leading-relaxed text-slate-500">
                O sistema de gestão executivo que coloca você no comando total
                do seu lucro. Inteligência, simplicidade e precisão para quem
                vende todo dia.
              </p>
            </div>
            <div>
              <h5 className="mb-8 text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">
                PLATAFORMA
              </h5>
              <ul className="space-y-5 text-sm font-bold text-slate-500">
                <li>
                  <a
                    className="transition-colors hover:text-slate-900"
                    href="#how-it-works"
                  >
                    Como funciona
                  </a>
                </li>
                <li>
                  <a
                    className="transition-colors hover:text-slate-900"
                    href="#pricing"
                  >
                    Preços
                  </a>
                </li>
                <li>
                  <a
                    className="transition-colors hover:text-slate-900"
                    href="#"
                  >
                    Status do Sistema
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="mb-8 text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">
                SEGURANÇA
              </h5>
              <ul className="space-y-5 text-sm font-bold text-slate-500">
                <li>
                  <a
                    className="transition-colors hover:text-slate-900"
                    href="#"
                  >
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a
                    className="transition-colors hover:text-slate-900"
                    href="#"
                  >
                    Privacidade
                  </a>
                </li>
                <li>
                  <a
                    className="transition-colors hover:text-slate-900"
                    href="#"
                  >
                    Backups Diários
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-8 border-t border-slate-50 pt-12 md:flex-row">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              © 2026 STOCKLY TECHNOLOGY. TODOS OS DIREITOS RESERVADOS.
            </p>
            <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              <a className="transition-colors hover:text-slate-900" href="#">
                SUPORTE
              </a>
              <a className="transition-colors hover:text-slate-900" href="#">
                SEGURANÇA
              </a>
              <Link
                className="transition-colors hover:text-slate-900"
                href="/login"
              >
                LOGIN
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

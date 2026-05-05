"use client"; // Re-compile trigger

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/app/_components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Package2,
  ShoppingCart,
  Zap,
  BarChart3,
  Users,
  Globe,
  Smartphone,
  Server,
  Database,
  Menu,
  X,
} from "lucide-react";
import { KipoLogo } from "@/app/_components/logo";
import { Sheet, SheetContent, SheetTrigger } from "@/app/_components/ui/sheet";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ANIMATION VARIANTS
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8 },
};

const LandingPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/10">
      {/* HEADER */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="transition-all hover:scale-[1.02]">
            <KipoLogo showText className="origin-left scale-[0.6] sm:scale-75" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-10 text-sm font-semibold text-muted-foreground lg:flex">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Funcionalidades
            </a>
            <a href="#hub" className="transition-colors hover:text-foreground">
              Integração
            </a>
            <a
              href="#pricing"
              className="transition-colors hover:text-foreground"
            >
              Investimento
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Actions */}
            <div className="hidden items-center gap-4 md:flex">
              <Button
                variant="ghost"
                asChild
                className="font-bold text-muted-foreground hover:text-primary"
              >
                <Link href="/login">Entrar</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-primary px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                <Link href="/register">Agendar Demonstração</Link>
              </Button>
            </div>

            {/* Mobile Menu */}
            <div className="flex items-center md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col gap-8 pt-10">
                    <KipoLogo showText className="scale-75" />
                    <nav className="flex flex-col gap-4">
                      <a
                        href="#features"
                        className="text-lg font-bold text-foreground transition-colors hover:text-primary"
                      >
                        Funcionalidades
                      </a>
                      <a
                        href="#hub"
                        className="text-lg font-bold text-foreground transition-colors hover:text-primary"
                      >
                        Integração
                      </a>
                      <a
                        href="#pricing"
                        className="text-lg font-bold text-foreground transition-colors hover:text-primary"
                      >
                        Investimento
                      </a>
                    </nav>
                    <hr className="border-border" />
                    <div className="flex flex-col gap-4">
                      <Button
                        variant="outline"
                        asChild
                        className="h-14 w-full rounded-2xl text-lg font-bold"
                      >
                        <Link href="/login">Entrar</Link>
                      </Button>
                      <Button
                        asChild
                        className="h-14 w-full rounded-2xl bg-primary text-lg font-bold shadow-lg shadow-primary/20"
                      >
                        <Link href="/register">Agendar Demonstração</Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        {/* SECTION 1: HERO (LIGHT PREMIUM) */}
        <section
          id="hero"
          className="relative overflow-hidden bg-background px-6 py-24 md:py-40"
        >
          <div className="mx-auto max-w-7xl text-center">
            <motion.h1
              {...fadeInUp}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="xs:text-5xl mb-8 text-4xl font-black leading-[1.1] tracking-tight text-foreground sm:text-7xl md:text-[84px]"
            >
              Gestão inteligente para <br className="hidden md:block" />
              <span className="text-gradient">bares e restaurantes.</span>
            </motion.h1>

            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="xs:text-lg mx-auto mb-12 max-w-2xl px-4 text-base font-medium text-muted-foreground md:text-xl"
            >
              Do pedido na mesa ao controle do estoque: conecte seu salão,
              cozinha e caixa em um só sistema sem complicação.
            </motion.p>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-24 flex flex-col items-center justify-center gap-4 px-4 sm:flex-row sm:gap-5"
            >
              <Button
                className="h-14 w-full rounded-full bg-primary px-8 text-lg font-bold shadow-xl transition-all hover:scale-105 hover:shadow-primary/20 sm:h-16 sm:w-auto sm:px-10 sm:text-xl"
                size="lg"
                asChild
              >
                <Link href="/register">Agendar Demonstração</Link>
              </Button>
              <Button
                variant="outline"
                className="h-14 w-full rounded-full border-border bg-background px-8 text-lg font-bold shadow-sm transition-all hover:bg-slate-50 sm:h-16 sm:w-auto sm:px-10 sm:text-xl"
                size="lg"
              >
                Fale com um especialista
              </Button>
            </motion.div>

            {/* 21st.dev HERO EFFECT: GLOW BEHIND DASHBOARD */}
            <div className="relative mx-auto mt-20 max-w-5xl">
              {/* Backglow Effect */}
              <div className="absolute -top-12 left-1/2 h-[100px] w-full -translate-x-1/2 rounded-full bg-gradient-to-r from-primary via-orange-500 to-primary opacity-30 blur-[100px]" />

              {/* Dashboard Preview Section */}
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1.2,
                  delay: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative mx-auto mt-24 max-w-6xl overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] sm:rounded-[2rem] sm:px-4 lg:px-0"
              >
                <img
                  src="/prints/painel-vendas-kipo-operacional.png"
                  alt="Kipo Dashboard Preview"
                  className="h-auto w-full rounded-xl object-cover sm:rounded-[1.5rem]"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE HUB (LIGHT PREMIUM WITH SVG LINES) */}
        <section
          id="hub"
          className="relative overflow-hidden bg-slate-50 px-6 py-24 md:py-40"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-between gap-24 text-center lg:flex-row lg:text-left">
              <div className="max-w-xl">
                <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary sm:mb-6 sm:text-xs">
                  Ecossistema Integrado
                </span>
                <h2 className="xs:text-4xl mb-6 text-3xl font-black leading-tight text-foreground sm:mb-8 sm:text-6xl">
                  O coração da sua <br className="hidden lg:block" /> operação
                  gastronômica.
                </h2>
                <p className="text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
                  Esqueça os sistemas lentos dos anos 2000. O Kipo integra suas
                  vendas físicas, controle de mesas e baixa de insumos no
                  estoque em tempo real.
                </p>
              </div>

              <div className="relative flex min-h-[500px] w-full max-w-[500px] items-center justify-center">
                {/* Central Logo - Rectangular to fit horizontal brand logo */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="relative z-20 flex h-[94px] w-[94px] items-center justify-center rounded-2xl bg-primary p-2 shadow-2xl shadow-primary/30 ring-1 ring-primary/20"
                >
                  <KipoLogo className="scale-[1.8] brightness-0 invert" />
                </motion.div>

                {/* SVG Lines */}
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      id="line-gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--primary)"
                        stopOpacity="0.2"
                      />
                      <stop offset="50%" stopColor="var(--primary)" />
                      <stop
                        offset="100%"
                        stopColor="var(--primary)"
                        stopOpacity="0.2"
                      />
                    </linearGradient>
                  </defs>
                  {/* Connecting paths with calibrated center coordinates */}
                  <AnimatedPath d="M 22 26 Q 22 50, 50 50" />
                  <AnimatedPath d="M 78 26 Q 78 50, 50 50" />
                  <AnimatedPath d="M 22 74 Q 22 50, 50 50" />
                  <AnimatedPath d="M 78 74 Q 78 50, 50 50" />
                </svg>

                {/* Satellite Icons */}
                <Node
                  icon={ShoppingCart}
                  label="PDV Digital"
                  pos="top-0 left-[15%]"
                />
                <Node
                  icon={BarChart3}
                  label="Dashboard"
                  pos="top-0 right-[15%]"
                />
                <Node
                  icon={Users}
                  label="Multi-Times"
                  pos="bottom-0 left-[15%]"
                />
                <Node
                  icon={Globe}
                  label="Multi-Lojas"
                  pos="bottom-0 right-[15%]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: FEATURES (LIGHT PREMIUM) */}
        <section id="features" className="bg-background px-6 py-24 md:py-40">
          <div className="mx-auto max-w-7xl">
            <div className="space-y-40">
              {/* Feature 1 */}
              <div className="flex flex-col items-center gap-16 md:flex-row">
                <div className="flex-1 space-y-8">
                  <div className="h-1.5 w-20 bg-primary" />
                  <h3 className="text-2xl font-black text-foreground sm:text-5xl">
                    Atendimento rápido, cliente feliz.
                  </h3>
                  <p className="text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
                    Dê adeus à demora. Garçons tiram pedidos direto do celular
                    ou tablet, a cozinha recebe na hora e o fechamento da conta
                    leva segundos.
                  </p>
                  <ul className="space-y-3 sm:space-y-4">
                    {[
                      "Fim dos erros de comanda",
                      "Controle de gorjetas automático",
                      "Agilidade no horário de pico",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm font-semibold text-foreground sm:text-base"
                      >
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="aspect-video w-full overflow-hidden rounded-[2.5rem] border border-border bg-muted/5 p-0">
                    <img
                      src="/prints/print-garcon-no-atendimento-ambiente-organizado-usando-sistema-kipo-landing-page.png"
                      alt="Kipo Service Preview"
                      className="h-auto w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center gap-16 md:flex-row-reverse">
                <div className="flex-1 space-y-8">
                  <div className="h-1.5 w-20 bg-orange-500" />
                  <h3 className="text-2xl font-black text-foreground sm:text-5xl">
                    Nunca mais falte cerveja no fim de semana.
                  </h3>
                  <p className="text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
                    Saiba exatamente o que comprar e quando repor. O estoque é
                    atualizado sozinho a cada venda no caixa, evitando
                    desperdícios e dinheiro parado.
                  </p>
                  <Button
                    variant="outline"
                    className="h-12 rounded-full px-6 shadow-sm hover:bg-slate-50 sm:h-auto"
                  >
                    Saber mais sobre IA
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="aspect-video w-full overflow-hidden rounded-[2.5rem] border border-border bg-muted/5 p-0">
                    <img
                      src="/prints/estoque-organizado-usando-kipo-melhor-sistema-para-bares-e-restaurantes.png"
                      alt="Kipo Inventory Preview"
                      className="h-auto w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: PRICING (MODERN LIGHT) */}
        <section id="pricing" className="bg-slate-50 px-6 py-24 md:py-40">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div {...fadeInUp}>
              <h2 className="xs:text-4xl mb-6 text-3xl font-black text-foreground sm:text-6xl">
                Invista na paz de espírito do seu negócio.
              </h2>
              <p className="mb-10 text-lg font-medium text-muted-foreground sm:mb-20 sm:text-xl">
                Investimento sob medida para empresas em expansão.
              </p>

              <div className="relative mx-auto max-w-[540px] overflow-hidden rounded-[2rem] border border-border bg-white p-6 text-left shadow-2xl sm:rounded-[2.5rem] sm:p-12">
                <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-primary to-orange-500" />

                <div className="flex flex-col gap-8 sm:gap-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-foreground sm:text-2xl">
                        Enterprise
                      </h3>
                      <p className="text-[10px] font-bold text-primary sm:text-sm">
                        SOLUÇÃO COMPLETA
                      </p>
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary sm:px-4 sm:text-xs">
                      Experiência VIP
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl">
                        R$ 249
                      </span>
                      <span className="text-base font-bold text-muted-foreground sm:text-lg">
                        /mês
                      </span>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground sm:text-sm">
                      + R$ 4.500 de Setup de Implementação
                    </p>
                  </div>

                  <ul className="space-y-4 sm:space-y-5">
                    {[
                      "Consultoria Especializada",
                      "Monitoramento Preditivo",
                      "Dashboards Ilimitados",
                      "Suporte VIP via WhatsApp",
                      "Acesso Multi-Unidades",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm font-semibold text-slate-600 sm:gap-4 sm:text-base"
                      >
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Button className="h-14 w-full rounded-xl bg-foreground text-sm font-black uppercase tracking-normal text-background transition-all hover:scale-[1.02] active:scale-95 sm:h-16 sm:rounded-2xl sm:text-lg sm:tracking-widest">
                    Falar com especialista
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 md:flex-row">
          <KipoLogo showText className="scale-75" />
          <p className="text-sm font-medium text-muted-foreground">
            © {new Date().getFullYear()} Kipo. Todos os direitos reservados.
          </p>
          <div className="flex gap-8 text-sm font-bold text-foreground">
            <Link
              href="/privacidade"
              className="transition-colors hover:text-primary"
            >
              Privacidade
            </Link>
            <Link
              href="/termos"
              className="transition-colors hover:text-primary"
            >
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

// SUBCOMPONENTS
const AnimatedPath = ({ d }: { d: string }) => (
  <motion.path
    d={d}
    stroke="url(#line-gradient)"
    strokeWidth="1.5"
    fill="transparent"
    strokeDasharray="4 4"
    initial={{ strokeDashoffset: 100, opacity: 0 }}
    animate={{ strokeDashoffset: 0, opacity: 1 }}
    transition={{
      duration: 15,
      repeat: Infinity,
      ease: "linear",
      opacity: { duration: 1 },
    }}
  />
);

const Node = ({
  icon: Icon,
  label,
  pos,
}: {
  icon: any;
  label: string;
  pos: string;
}) => (
  <div className={cn("absolute flex flex-col items-center gap-3", pos)}>
    <div className="group relative flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-white shadow-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <Icon className="h-6 w-6 text-slate-400 transition-colors group-hover:text-primary" />
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
      {label}
    </span>
  </div>
);

export default LandingPage;

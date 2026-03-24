"use client";

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
} from "lucide-react";
import { KipoLogo } from "@/app/_components/logo";
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
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="transition-all hover:scale-[1.02]">
            <KipoLogo className="scale-75 origin-left" />
          </Link>
          <div className="hidden items-center gap-10 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Funcionalidades</a>
            <a href="#hub" className="transition-colors hover:text-foreground">Integração</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Investimento</a>
          </div>
          <Button asChild className="rounded-full bg-primary px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Link href="/register">Agendar Demonstração</Link>
          </Button>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        {/* SECTION 1: HERO (LIGHT PREMIUM) */}
        <section id="hero" className="relative overflow-hidden bg-background px-6 py-24 md:py-40">
          <div className="mx-auto max-w-7xl text-center">
            <motion.h1
              {...fadeInUp}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-8 text-5xl font-black leading-[1.1] tracking-tight text-foreground sm:text-7xl md:text-[84px]"
            >
              Controle absoluto <br className="hidden md:block" />
              <span className="text-gradient">sem abrir uma planilha.</span>
            </motion.h1>

            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mx-auto mb-12 max-w-2xl text-lg font-medium text-muted-foreground md:text-xl"
            >
              Elimine gargalos operacionais e recupere o controle total da sua empresa com a inteligência do Kipo. Desenhado para líderes que buscam escala.
            </motion.p>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-24 flex flex-col items-center justify-center gap-5 sm:flex-row"
            >
              <Button
                className="h-16 w-full rounded-full bg-primary px-10 text-xl font-bold shadow-xl transition-all hover:scale-105 hover:shadow-primary/20 sm:w-auto"
                size="lg"
                asChild
              >
                <Link href="/register">Agendar Demonstração</Link>
              </Button>
              <Button
                variant="outline"
                className="h-16 w-full rounded-full border-border bg-background px-10 text-xl font-bold shadow-sm transition-all hover:bg-slate-50 sm:w-auto"
                size="lg"
              >
                Fale com um especialista
              </Button>
            </motion.div>

            {/* 21st.dev HERO EFFECT: GLOW BEHIND DASHBOARD */}
            <div className="relative mx-auto mt-20 max-w-5xl">
              {/* Backglow Effect */}
              <div className="absolute -top-12 left-1/2 h-[100px] w-full -translate-x-1/2 rounded-full bg-gradient-to-r from-primary via-orange-500 to-primary blur-[100px] opacity-30" />
              
              {/* Dashboard Preview Section */}
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 1.2, 
                  delay: 0.4,
                  ease: [0.22, 1, 0.36, 1] 
                }}
                className="relative mx-auto mt-24 max-w-6xl px-4 lg:px-0 overflow-hidden rounded-[2rem] border border-border bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)]"
              >
                  <img 
                    src="/prints/print-dashboard-kipo-landing-page.png" 
                    alt="Kipo Dashboard Preview" 
                    className="w-full h-auto object-cover"
                  />
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE HUB (LIGHT PREMIUM WITH SVG LINES) */}
        <section id="hub" className="relative overflow-hidden bg-slate-50 px-6 py-24 md:py-40">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-between gap-24 lg:flex-row lg:text-left text-center">
              <div className="max-w-xl">
                <span className="mb-6 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                  Ecossistema Integrado
                </span>
                <h2 className="mb-8 text-4xl font-black leading-tight sm:text-6xl text-foreground">
                  Um único centro <br className="hidden lg:block" /> de comando operacional.
                </h2>
                <p className="text-lg font-medium leading-relaxed text-muted-foreground">
                  O Kipo não é apenas um software, é o coração da sua empresa. Conecte PDV, 
                  Estoque e Gestão em um diagrama de fluxo contínuo e automatizado.
                </p>
              </div>

              <div className="relative flex min-h-[500px] w-full max-w-[600px] items-center justify-center">
                {/* Central Logo - Rectangular to fit horizontal brand logo */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="relative z-20 flex h-24 w-36 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/30 ring-1 ring-primary/20 p-2"
                >
                  <KipoLogo className="scale-[0.5] brightness-0 invert" />
                </motion.div>

                {/* SVG Lines */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  {/* Connecting paths with calibrated center coordinates */}
                  <AnimatedPath d="M 22 26 Q 22 50, 50 50" />
                  <AnimatedPath d="M 78 26 Q 78 50, 50 50" />
                  <AnimatedPath d="M 22 74 Q 22 50, 50 50" />
                  <AnimatedPath d="M 78 74 Q 78 50, 50 50" />
                </svg>

              {/* Satellite Icons */}
              <Node icon={ShoppingCart} label="PDV Digital" pos="top-0 left-[15%]" />
              <Node icon={BarChart3} label="Dashboard" pos="top-0 right-[15%]" />
              <Node icon={Users} label="Multi-Times" pos="bottom-0 left-[15%]" />
              <Node icon={Globe} label="Multi-Lojas" pos="bottom-0 right-[15%]" />
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
                  <h3 className="text-3xl font-black text-foreground sm:text-5xl">
                    Performance em tempo real.
                  </h3>
                  <p className="text-lg font-medium leading-relaxed text-muted-foreground">
                    A baixa de estoque é preditiva e automática, atualizando todos os seus canais em milissegundos.
                  </p>
                  <ul className="space-y-4">
                    {["Processamento Ultra-Rápido", "Cloud Sync Nativo", "Segurança Corporativa"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 font-semibold text-foreground">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="aspect-video w-full overflow-hidden rounded-[2.5rem] border border-border bg-muted/5 p-0">
                    <img 
                      src="/prints/print-moca-no-atendimento-ambiente-organizado-usando-sistema-kipo-landing-page.png" 
                      alt="Kipo Service Preview" 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center gap-16 md:flex-row-reverse">
                <div className="flex-1 space-y-8">
                  <div className="h-1.5 w-20 bg-orange-500" />
                  <h3 className="text-3xl font-black text-foreground sm:text-5xl">
                    Inteligência de Estoque.
                  </h3>
                  <p className="text-lg font-medium leading-relaxed text-muted-foreground">
                    Otimize seu capital de giro. Saiba exatamente o que comprar e quando, baseado em padrões históricos do seu negócio.
                  </p>
                  <Button variant="outline" className="rounded-full shadow-sm hover:bg-slate-50">
                    Saber mais sobre IA
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="aspect-video w-full overflow-hidden rounded-[2.5rem] border border-border bg-muted/5 p-0">
                    <img 
                      src="/prints/print-estoque-organizado-kipo-landing-page.png" 
                      alt="Kipo Inventory Preview" 
                      className="w-full h-auto object-cover"
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
              <h2 className="mb-6 text-4xl font-black text-foreground sm:text-6xl">
                Preço justo, valor imbatível.
              </h2>
              <p className="mb-20 text-xl font-medium text-muted-foreground">
                Investimento sob medida para empresas em expansão.
              </p>

              <div className="relative mx-auto max-w-[540px] overflow-hidden rounded-[2.5rem] border border-border bg-white p-12 text-left shadow-2xl">
                <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-primary to-orange-500" />
                
                <div className="flex flex-col gap-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">Enterprise</h3>
                      <p className="text-sm font-bold text-primary">SOLUÇÃO COMPLETA</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
                      Top Rated
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                       <span className="text-5xl font-black text-foreground tracking-tighter">R$ 249</span>
                       <span className="text-lg font-bold text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">
                       + R$ 4.500 de Setup de Implementação
                    </p>
                  </div>

                  <ul className="space-y-5">
                    {[
                      "Consultoria Especializada",
                      "Monitoramento Preditivo",
                      "Dashboards Ilimitados",
                      "Suporte VIP via WhatsApp",
                      "Acesso Multi-Unidades",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-slate-600 font-semibold">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Button className="h-16 w-full rounded-2xl bg-foreground text-lg font-black uppercase tracking-widest text-background transition-all hover:scale-[1.02] active:scale-95">
                    Falar com especialista
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background py-16 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-10">
          <KipoLogo className="scale-75" />
          <p className="text-sm font-medium text-muted-foreground">
            © {new Date().getFullYear()} Kipo. Todos os direitos reservados.
          </p>
          <div className="flex gap-8 text-sm font-bold text-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            <a href="#" className="hover:text-primary transition-colors">Termos</a>
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
    transition={{ duration: 15, repeat: Infinity, ease: "linear", opacity: { duration: 1 } }}
  />
);

const Node = ({ icon: Icon, label, pos }: { icon: any, label: string, pos: string }) => (
  <div className={cn("absolute flex flex-col items-center gap-3", pos)}>
    <div className="group relative flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-white shadow-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <Icon className="h-6 w-6 text-slate-400 transition-colors group-hover:text-primary" />
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
  </div>
);

export default LandingPage;

import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { 
  Package2, 
  CheckCircle2, 
  ArrowRight, 
  ShoppingCart, 
  History, 
  ShieldCheck,
  Smartphone,
  BarChart3,
  Zap,
  Lock,
  MessageCircle,
  AlertCircle,
} from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stockly | Controle seu estoque de forma simples e segura",
  description: "O sistema de gestão de estoque feito para quem não tem tempo a perder com planilhas. Tudo automático, rápido e seguro.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white selection:bg-primary/10 selection:text-primary">
      {/* HEADER */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-12">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-900">
              <Package2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase">STOCKLY</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-10">
            <a href="#problem" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">O Problema</a>
            <a href="#solutions" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Diferenciais</a>
            <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Como Funciona</a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Preços</a>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/login" className="hidden xs:block text-sm font-bold text-slate-600 hover:text-slate-900">
              Entrar
            </Link>
            <Button className="rounded-full px-4 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm font-bold shadow-lg shadow-primary/20" asChild>
              <Link href="/register">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-16 sm:py-20 lg:py-32">
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 sm:px-4 py-1.5 backdrop-blur-sm">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-primary">Feito para quem vende todo dia</span>
              </div>

              <h1 className="mb-4 sm:mb-6 text-3xl sm:text-5xl font-black tracking-tight text-slate-900 lg:text-7xl leading-[1.2] sm:leading-[1.1]">
                Controle seu estoque sem planilhas e <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-slate-400">venda muito mais.</span>
              </h1>
              
              <p className="mb-8 sm:mb-10 max-w-2xl text-base sm:text-lg lg:text-xl text-slate-500 font-medium leading-relaxed px-4 sm:px-0">
                Registre produtos, acompanhe vendas e saiba exatamente o que comprar. <br className="hidden md:block" />
                <span className="text-slate-900 font-bold">Teste grátis por 30 dias. Sem cartão necessário.</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-12 sm:mb-16 w-full sm:w-auto px-6 sm:px-0">
                <Button size="lg" className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 text-sm sm:text-base font-bold rounded-full shadow-2xl shadow-primary/30 group" asChild>
                  <Link href="/register">
                    Começar teste grátis
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 text-sm sm:text-base font-bold rounded-full hover:bg-slate-50 border border-slate-200" asChild>
                  <a href="#how-it-works">Ver como funciona</a>
                </Button>
              </div>

              {/* Dashboard Preview with Real-like Data */}
              <div className="relative w-full max-w-5xl rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 bg-slate-50/50 p-2 sm:p-4 shadow-2xl group overflow-hidden sm:overflow-visible">
                 <div className="hidden sm:block absolute -top-5 lg:-top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-2 rounded-full uppercase tracking-widest z-20 shadow-xl border border-white/10 group-hover:scale-105 transition-transform">
                    Simulação Real do Sistema
                 </div>
                 <div className="overflow-hidden rounded-xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm aspect-[4/3] sm:aspect-[16/9] flex flex-col relative">
                    <div className="h-10 sm:h-14 border-b border-slate-100 flex items-center px-4 sm:px-8 gap-4 sm:gap-10">
                      <div className="flex gap-1.5 sm:gap-2">
                        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-slate-100" />
                        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-slate-100" />
                        <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-slate-100" />
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4">
                         <div className="h-1.5 sm:h-2 w-16 sm:w-24 bg-slate-50 rounded" />
                         <div className="h-1.5 sm:h-2 w-20 sm:w-32 bg-slate-50 rounded" />
                      </div>
                    </div>
                    <div className="flex-1 p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-8">
                      {/* Sidebar - hidden on mobile for cleaner preview */}
                      <div className="hidden sm:block col-span-1 space-y-6 text-left">
                        <div className="h-12 w-full bg-primary rounded-xl flex items-center px-4 gap-3 text-white">
                           <History className="h-5 w-5" />
                           <div className="h-2 w-16 bg-white/20 rounded" />
                        </div>
                        <div className="space-y-3 pt-4">
                           <div className="h-2 w-full bg-slate-50 rounded" />
                           <div className="h-2 w-3/4 bg-slate-50 rounded" />
                        </div>
                      </div>
                      <div className="col-span-1 sm:col-span-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
                           <div className="bg-slate-50/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-100 relative group/card hover:bg-white hover:border-primary/20 transition-all text-left">
                              <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter">Vendas Hoje</span>
                              <div className="text-sm sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1">R$ 1.250</div>
                           </div>
                           <div className="bg-slate-50/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-100 relative group/card hover:bg-white hover:border-primary/20 transition-all text-left">
                              <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter">Itens Baixos</span>
                              <div className="text-sm sm:text-2xl font-black text-red-500 mt-0.5 sm:mt-1">08 itens</div>
                           </div>
                           <div className="hidden sm:block bg-slate-50/50 rounded-2xl p-6 border border-slate-100 relative group/card hover:bg-white hover:border-primary/20 transition-all text-left">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Lucro Líquido</span>
                              <div className="text-2xl font-black text-slate-900 mt-1">R$ 482</div>
                           </div>
                        </div>

                        <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200 p-4 sm:p-8 shadow-sm">
                           <div className="flex items-center justify-between mb-4 sm:mb-8">
                              <h4 className="text-[10px] sm:text-sm font-black text-slate-900 uppercase tracking-widest text-left">Estoque Crítico</h4>
                              <div className="px-3 py-1 rounded-full bg-slate-50 text-[10px] font-bold text-slate-400">Ver todos</div>
                           </div>
                           <div className="space-y-4 sm:space-y-6">
                              {[
                                { name: "Brownie de Nutella", stock: "12 unid", min: "20 unid", status: "Crítico", color: "text-red-500" },
                                { name: "Suco de Amora 500ml", stock: "05 unid", min: "15 unid", status: "Baixo", color: "text-amber-500" },
                                { name: "Pão Artesanal", stock: "10 unid", min: "40 unid", status: "Crítico", color: "text-red-500" }
                              ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                   <div className="flex items-center gap-3 sm:gap-4">
                                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-[10px] sm:text-xs">#{i+1}</div>
                                      <div className="text-left">
                                         <div className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[120px] sm:max-w-none">{item.name}</div>
                                         <div className="text-[10px] text-slate-400 font-medium">Estoque: {item.stock}</div>
                                      </div>
                                   </div>
                                   <div className="flex flex-col items-end shrink-0">
                                      <div className={`text-[8px] sm:text-[10px] font-black uppercase ${item.color}`}>{item.status}</div>
                                      <div className="text-[10px] font-bold text-slate-300">Min: {item.min}</div>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    </div>
                    {/* Tooltip Overlay - hidden on very small screens */}
                    <div className="hidden md:block absolute bottom-10 right-10 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 animate-float max-w-[220px] text-left">
                       <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="text-[10px] font-black tracking-widest uppercase">Inteligência Ativa</span>
                       </div>
                       <p className="text-xs font-medium text-slate-300">&ldquo;Você nunca mais vai perder venda por falta de estoque.&rdquo;</p>
                    </div>
                 </div>
              </div>
              
              <p className="mt-8 sm:mt-12 text-[10px] sm:text-sm text-slate-400 font-bold uppercase tracking-widest px-6">
                Sem renovação automática • Ative em 2 minutos
              </p>
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section id="problem" className="py-16 sm:py-24 bg-slate-50 border-y border-slate-100 text-left">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="mb-12 sm:mb-16 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 lg:text-4xl leading-tight">
                Se isso acontece com você, o Stockly resolve.
              </h2>
            </div>
            
            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              {[
                {
                  icon: AlertCircle,
                  title: "Produto acaba sem aviso",
                  text: "Você perde vendas valiosas porque não sabia que o estoque tinha acabado.",
                  color: "text-red-500 bg-red-50"
                },
                {
                  icon: BarChart3,
                  title: "Planilhas desatualizadas",
                  text: "Controle manual toma horas do seu dia, cansa e gera erros constantes.",
                  color: "text-amber-500 bg-amber-50"
                },
                {
                  icon: ShoppingCart,
                  title: "Dinheiro parado",
                  text: "Você compra mercadoria no escuro, sem saber o que realmente precisa para lucrar.",
                  color: "text-blue-500 bg-blue-50"
                }
              ].map((item, i) => (
                <div key={i} className="flex flex-col p-8 sm:p-10 bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl sm:hover:-translate-y-1">
                  <div className={`mb-6 sm:mb-8 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${item.color}`}>
                    <item.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium text-sm sm:text-base">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUTION SECTION */}
        <section id="solutions" className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 sm:gap-20 items-center">
               <div className="order-2 lg:order-1 relative px-4 sm:px-0">
                  <div className="aspect-square bg-slate-50 rounded-3xl sm:rounded-[4rem] border border-slate-100 flex items-center justify-center p-6 sm:p-12">
                     <div className="w-full space-y-4 sm:space-y-6">
                        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl p-5 sm:p-8 flex items-center gap-4 sm:gap-6 animate-float text-left">
                           <div className="h-10 w-10 sm:h-14 sm:w-14 bg-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-600">
                              <ShoppingCart className="h-5 w-5 sm:h-7 sm:w-7" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="h-1.5 sm:h-2 w-20 sm:w-32 bg-slate-100 rounded mb-2 sm:mb-3" />
                              <div className="text-sm sm:text-lg font-black text-slate-900 truncate">Venda: Brownie</div>
                           </div>
                           <div className="text-emerald-600 font-black text-sm sm:text-xl shrink-0">+ R$ 18</div>
                        </div>
                        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 flex items-center gap-4 sm:gap-6 translate-x-4 sm:translate-x-12 opacity-80 scale-95 text-left">
                           <div className="h-10 w-10 sm:h-14 sm:w-14 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-600">
                              <Package2 className="h-5 w-5 sm:h-7 sm:w-7" />
                           </div>
                           <div className="flex-1">
                              <div className="h-1.5 sm:h-2 w-16 sm:w-24 bg-slate-50 rounded" />
                              <div className="text-xs sm:text-md font-bold text-slate-400 mt-1.5 sm:mt-2">Estoque atualizado</div>
                           </div>
                           <div className="text-blue-600 font-black text-xs sm:text-base shrink-0">- 1 unid</div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="order-1 lg:order-2 space-y-6 sm:space-y-10 text-center lg:text-left">
                  <div className="space-y-3 sm:space-y-4">
                     <h2 className="text-xs sm:text-base font-bold text-primary uppercase tracking-[0.2em] mb-2 sm:mb-4">Sua empresa organizada</h2>
                     <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">Matenha o controle total sem esforço manual.</p>
                  </div>

                  <div className="space-y-6 sm:space-y-8 text-left">
                     {[
                       { title: "Controle automático", text: "O estoque atualiza sozinho em tempo real cada vez que você registra uma venda." },
                       { title: "Visão clara do negócio", text: "Saiba quais produtos são os seus favoritos e onde está o seu maior lucro." },
                       { title: "Organização simples", text: "Tudo o que você precisa em uma tela limpa, desenhada para ser rápida e fácil." }
                     ].map((item, i) => (
                       <div key={i} className="flex gap-4 sm:gap-6">
                          <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-500 shrink-0 mt-1" />
                          <div>
                             <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">{item.title}</h4>
                             <p className="text-slate-500 font-medium leading-relaxed text-sm sm:text-lg">{item.text}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-16 sm:py-24 bg-slate-900 text-white overflow-hidden relative">
          <div className="container mx-auto px-6 lg:px-12 relative z-10">
             <div className="mb-12 sm:mb-20 text-center max-w-2xl mx-auto">
               <h2 className="text-2xl sm:text-3xl font-black md:text-5xl">Simples de usar.</h2>
               <p className="mt-2 sm:mt-4 text-slate-400 font-medium text-sm sm:text-lg">Três passos para nunca mais perder o controle.</p>
             </div>

             <div className="grid md:grid-cols-3 gap-12 sm:gap-16 md:gap-12">
                {[
                  { step: "01", title: "Cadastre", text: "Adicione seus produtos em minutos, configurando níveis mínimos para alertas." },
                  { step: "02", title: "Registre vendas", text: "A cada venda, o sistema automaticamente baixa o estoque físico." },
                  { step: "03", title: "Receba alertas", text: "O sistema te avisa quando comprar, evitando faltas ou excesso de estoque." }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                    <div className="mb-6 sm:mb-10 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl sm:rounded-[2rem] bg-white/10 text-primary-foreground text-2xl sm:text-3xl font-black group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:scale-110">
                      {item.step}
                    </div>
                    <h3 className="mb-3 sm:mb-6 text-xl sm:text-2xl font-bold tracking-tight">{item.title}</h3>
                    <p className="text-slate-400 font-medium leading-relaxed text-sm sm:text-lg">
                      {item.text}
                    </p>
                    <div className="mt-4 sm:mt-6 flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-primary/60 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                       <Zap className="h-3 w-3" /> 
                       {i === 0 ? "Em poucos minutos" : i === 1 ? "Baixa automática" : "Evita perder vendas"}
                    </div>
                  </div>
                ))}
             </div>
          </div>
          <div className="absolute top-0 right-0 h-full w-1/2 opacity-10 bg-[radial-gradient(circle_at_2px_2px,_rgba(255,255,255,0.05)_1px,_transparent_0)] bg-[length:32px_32px]" />
        </section>

        {/* TRUST SECTION */}
        <section className="py-16 sm:py-24 bg-white border-b border-slate-100">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="mb-12 sm:mb-16 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 lg:text-4xl leading-tight">
                Segurança para quem depende do negócio.
              </h2>
            </div>
            
            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              {[
                { title: "Histórico completo", text: "Veja tudo o que foi alterado, por quem e em que momento. Rastreabilidade total." },
                { title: "Controle de acesso", text: "Cadastre sua equipe com permissões específicas. Você decide o que cada um vê." },
                { title: "Proteção de dados", text: "Suas informações estão criptografadas e salvas na nuvem com backups diários." }
              ].map((item, i) => (
                <div key={i} className="glass-card rounded-2xl sm:rounded-[2.5rem] p-8 sm:p-10 flex flex-col gap-4 sm:gap-6 sm:hover:shadow-xl transition-all border border-slate-100 text-left">
                  <div className="flex items-center gap-3 sm:gap-4">
                     <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                     </div>
                     <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{item.title}</h3>
                  </div>
                  <p className="text-slate-500 font-medium leading-relaxed text-sm sm:text-lg">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-16 sm:py-24 bg-slate-50 relative overflow-hidden">
          <div className="container mx-auto px-6 lg:px-12 relative z-10">
            <div className="mb-12 sm:mb-20 text-center max-w-3xl mx-auto">
               <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4 sm:mb-6">Comece agora seu teste grátis.</h2>
               <p className="text-sm sm:text-xl text-slate-500 font-medium px-4">Use todas as funcionalidades sem restrições por 30 dias.</p>
            </div>

            <div className="max-w-xl mx-auto px-4 sm:px-0">
              <div className="rounded-[2rem] sm:rounded-[3rem] border-2 border-primary bg-white p-8 sm:p-12 flex flex-col relative shadow-2xl sm:scale-105">
                 <div className="absolute top-6 sm:top-8 right-6 sm:right-8 bg-primary text-white text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-widest border border-white/10">
                   MELHOR VALOR
                 </div>
                 <div className="mb-8 sm:mb-10 text-left">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 sm:mb-2 uppercase tracking-tighter">Plano Profissional</h3>
                    <p className="text-slate-400 font-bold text-[10px] sm:text-sm tracking-wide">TUDO INCLUSO PARA SUA OPERAÇÃO</p>
                 </div>
                 
                 <div className="mb-8 sm:mb-12 text-left">
                    <div className="text-slate-900">
                       <span className="text-4xl sm:text-6xl font-black italic tracking-tighter">R$ 49</span>
                       <span className="text-slate-400 font-bold ml-2 text-lg sm:text-xl">/mês</span>
                    </div>
                    <p className="mt-3 sm:mt-4 text-emerald-600 font-black text-[10px] sm:text-sm uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-lg">
                       Teste grátis por 30 dias
                    </p>
                 </div>

                 <ul className="mb-8 sm:mb-12 space-y-4 sm:space-y-6 flex-1 border-t border-slate-50 pt-8 sm:pt-10">
                   {[
                     "Produtos e Vendas Ilimitadas", 
                     "Histórico Completo", 
                     "Alertas Inteligentes", 
                     "Relatórios de Lucro",
                     "Exportação (Excel/PDF)",
                     "Suporte via WhatsApp"
                   ].map((f, i) => (
                      <li key={i} className="flex items-center gap-3 sm:gap-4 text-slate-900 font-bold text-sm sm:text-lg text-left">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary fill-primary shrink-0" />
                        {f}
                      </li>
                   ))}
                 </ul>
                 
                 <div className="space-y-3 sm:space-y-4">
                    <Button className="w-full h-14 sm:h-18 text-base sm:text-xl rounded-full font-black shadow-2xl shadow-primary/30" asChild>
                      <Link href="/register">Começar teste grátis</Link>
                    </Button>
                    <p className="text-center text-[8px] sm:text-xs font-bold text-slate-400 tracking-widest uppercase">
                       SEM CARTÃO • CANCELE QUANDO QUISER
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 sm:py-24 bg-white relative overflow-hidden text-center">
          <div className="container relative z-10 mx-auto px-6 max-w-4xl">
             <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black mb-6 sm:mb-8 text-slate-900 leading-[1.2] sm:leading-[1.1]">Você nunca mais vai perder venda por falta de estoque.</h2>
             <p className="text-base sm:text-xl text-slate-500 mb-8 sm:mb-12 font-medium px-4">
               Ative o sistema hoje, automatize sua rotina e trabalhe com tranquilidade.
             </p>
             <div className="flex flex-col items-center gap-6 sm:gap-8">
                <Button size="lg" className="w-full sm:w-auto h-16 sm:h-20 px-10 sm:px-16 text-lg sm:text-2xl font-black rounded-full group shadow-2xl shadow-primary/40 sm:border-4 border-primary transition-transform sm:hover:scale-105 active:scale-95" asChild>
                  <Link href="/register">
                    Começar teste grátis
                    <ArrowRight className="ml-3 h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                
                <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-[9px] sm:text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] sm:tracking-[0.25em] border-t border-slate-50 pt-8 sm:pt-10 w-full max-w-2xl mx-auto">
                  <div className="flex items-center gap-1.5 sm:gap-2"><Lock className="h-3 w-3" /> SETUP RÁPIDO</div>
                  <div className="flex items-center gap-1.5 sm:gap-2"><Smartphone className="h-3 w-3" /> CELULAR</div>
                  <div className="flex items-center gap-1.5 sm:gap-2"><MessageCircle className="h-3 w-3" /> WHATSAPP</div>
                </div>
             </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-50 border-t border-slate-200 py-24 pb-12">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between gap-16 mb-20">
            <div className="flex flex-col items-start gap-6">
               <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-900">
                    <Package2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">STOCKLY</span>
               </div>
               <p className="text-md text-slate-500 max-w-xs font-bold leading-relaxed">
                 O sistema de gestão que coloca você no comando do seu lucro. 
                 Simples, rápido e essencial para quem vende.
               </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-20 lg:gap-32 text-sm">
                <div className="flex flex-col gap-6">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest">Plataforma</h4>
                  <div className="flex flex-col gap-5 text-slate-500 font-bold">
                    <a href="#how-it-works" className="hover:text-primary transition-colors">Como funciona</a>
                    <a href="#pricing" className="hover:text-primary transition-colors">Preços</a>
                    <a href="#" className="hover:text-primary transition-colors">Status do Sistema</a>
                  </div>
                </div>
                <div className="flex flex-col gap-6">
                   <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest">Segurança</h4>
                  <div className="flex flex-col gap-5 text-slate-500 font-bold">
                    <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
                    <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
                    <a href="#" className="hover:text-primary transition-colors">Dúvidas Frequentes</a>
                  </div>
                </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center pt-10 border-t border-slate-200 gap-6 text-[11px] font-black uppercase text-slate-400 tracking-widest">
            <div>© 2026 Stockly Technology. Todos os direitos reservados.</div>
            <div className="flex items-center gap-10">
               <a href="#" className="hover:text-slate-900 transition-colors underline underline-offset-4 decoration-primary/20">Suporte</a>
               <a href="#" className="hover:text-slate-900 transition-colors underline underline-offset-4 decoration-primary/20">Segurança</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


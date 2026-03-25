import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

export default function PrivacyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 md:py-24">
      <div className="mx-auto max-w-3xl space-y-12">
        {/* Header */}
        <div className="space-y-6 text-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Button>
          </Link>
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
              <ShieldCheck className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Política de Privacidade
          </h1>
          <p className="text-slate-500">
            Em conformidade com a LGPD (Lei 13.709/2018)
          </p>
        </div>

        {/* Legal Model Disclaimer */}
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
          <p className="text-sm font-semibold leading-relaxed text-orange-700">
            ⚠️ AVISO LEGAL: Este texto é um modelo gerado por IA para fins de
            demonstração técnica de conformidade LGPD. A coleta de dados reais
            em ambiente de produção EXIGE a revisão de um advogado para garantir
            que todas as cláusulas estão aderentes às suas práticas específicas
            de tratamento de dados.
          </p>
        </div>

        {/* Content */}
        <article className="prose prose-slate max-w-none space-y-10 leading-relaxed text-slate-700">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 underline decoration-orange-500/30 decoration-4 underline-offset-4">
              1. Coleta de Dados Pessoais
            </h2>
            <p>
              Para a prestação do serviço Kipo, coletamos dados básicos sobre o
              Cliente (CNPJ, Razão Social, Nome do Proprietário e E-mail de
              Contato) e dados operacionais inseridos no sistema, como
              faturamento e histórico de vendas do PDV.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 underline decoration-orange-500/30 decoration-4 underline-offset-4">
              2. Finalidade do Tratamento
            </h2>
            <p>Os dados são utilizados exclusivamente para:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Execução do contrato de licenciamento do software;</li>
              <li>Emissão de notas fiscais e suporte técnico;</li>
              <li>
                Análise estatística agregada para melhoria das funcionalidades
                da plataforma.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 underline decoration-orange-500/30 decoration-4 underline-offset-4">
              3. Compartilhamento de Dados
            </h2>
            <p>
              Não vendemos seus dados para terceiros. O compartilhamento ocorre
              apenas com parceiros de infraestrutura tecnológica necessários
              para manter o Kipo no ar (ex: Amazon Web Services, Vercel ou
              Hostinger) e processadores de pagamento seguros.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 underline decoration-orange-500/30 decoration-4 underline-offset-4">
              4. Seus Direitos (LGPD)
            </h2>
            <p>
              Como titular dos dados, você tem o direito garantido por lei de:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Confirmar a existência de tratamento de seus dados;</li>
              <li>Acessar, corrigir e atualizar suas informações;</li>
              <li>
                Solicitar a exclusão definitiva dos dados após o término do
                contrato comercial.
              </li>
            </ul>
          </section>

          <section className="space-y-4 border-t border-slate-200 pt-10">
            <p className="text-xs italic text-muted-foreground">
              Dúvidas sobre privacidade? Entre em contato com nosso Encarregado
              de Proteção de Dados (DPO) através do e-mail
              contato@usekipo.com.br
            </p>
          </section>
        </article>

        <div className="flex items-center justify-between pt-8">
          <Link
            href="/termos"
            className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
          >
            ← Ver Termos de Uso
          </Link>
          <Link
            href="/"
            className="rounded-full border border-slate-200 px-6 py-2 text-sm font-bold text-slate-800 transition-all hover:bg-slate-100"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

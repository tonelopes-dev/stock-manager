import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

export default function TermsPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 md:py-24">
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
             <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Scale className="h-8 w-8 text-primary" />
             </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Termos de Uso
          </h1>
          <p className="text-slate-500">Última atualização: Março de {currentYear}</p>
        </div>

        {/* Legal Model Disclaimer */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm font-semibold text-blue-700">
            ⚠️ AVISO LEGAL: Este texto é um modelo gerado por IA para fins de demonstração técnica da plataforma Kipo. 
            Ele NÃO substitui o aconselhamento jurídico profissional. Antes de iniciar operações comerciais reais, 
            estes termos devem ser revisados e validados por um advogado especializado em Direito Digital.
          </p>
        </div>

        {/* Content */}
        <article className="prose prose-slate max-w-none space-y-10 text-slate-700 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma Kipo, você ("Cliente") concorda em cumprir estes Termos de Uso. 
              O Kipo é um software-as-a-service (SaaS) destinado exclusivamente à gestão empresarial B2B (Business-to-Business).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">2. Cadastro e Pagamento</h2>
            <p>
              O uso pleno das funcionalidades de estoque, PDV e cardápio digital está condicionado ao pagamento de uma assinatura mensal ou anual, 
              conforme o plano selecionado. O Cliente é o único responsável pela veracidade das informações de faturamento e dados vinculados ao CNPJ informado.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">3. Responsabilidades pelas Informações</h2>
            <p>
              O Kipo fornece a infraestrutura de software, mas não valida a origem ou a conformidade fiscal dos itens inseridos no sistema. 
              O Cliente é integralmente responsável pela correção dos dados de estoque, preços e transações efetuadas no PDV, inclusive tributações.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">4. Propriedade Intelectual</h2>
            <p>
              Todo o código-fonte, design, algoritmos e marcas associadas ao Kipo são de propriedade exclusiva da nossa empresa. 
              É expressamente proibida a engenharia reversa, cópia ou redistribuição parcial ou total da plataforma sem autorização prévia.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">5. Cancelamento e Reajustes</h2>
            <p>
              O Cliente pode solicitar o cancelamento a qualquer momento através do painel de administração. O acesso será mantido até o final do período já faturado. 
              Reservamo-nos o direito de reajustar valores anualmente mediante aviso prévio de 30 dias.
            </p>
          </section>
        </article>

        {/* Footer Link */}
        <div className="pt-12 border-t border-slate-200">
          <Link href="/privacidade" className="text-sm font-semibold text-primary hover:underline">
            Leia nossa Política de Privacidade →
          </Link>
        </div>
      </div>
    </div>
  );
}

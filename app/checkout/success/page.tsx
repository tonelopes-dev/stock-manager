import Link from "next/link";
import { CheckCircle2Icon, ArrowRightIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

export const dynamic = "force-dynamic";

const CheckoutSuccessPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-8">
      <div className="w-full max-w-md rounded-2xl bg-background p-10 text-center shadow-lg">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2Icon className="h-10 w-10 text-green-600" />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <SparklesIcon className="h-5 w-5 text-orange-500" />
          <h1 className="text-2xl font-bold text-foreground">
            Seu teste grátis começou!
          </h1>
          <SparklesIcon className="h-5 w-5 text-orange-500" />
        </div>

        {/* Description */}
        <p className="mb-8 text-muted-foreground">
          Você tem <strong className="text-foreground">3 dias</strong> para
          explorar todas as funcionalidades do plano Pro sem nenhum custo.
          Aproveite ao máximo!
        </p>

        {/* Features list */}
        <ul className="mb-8 space-y-2 text-left text-sm text-muted-foreground">
          {[
            "Produtos e insumos ilimitados",
            "Usuários ilimitados",
            "Dashboard avançado de vendas",
            "Auditoria completa de estoque",
            "Suporte prioritário",
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <CheckCircle2Icon className="h-4 w-4 flex-shrink-0 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button asChild className="w-full" size="lg">
          <Link href="/dashboard">
            Ir para o Dashboard
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Você pode gerenciar sua assinatura a qualquer momento em{" "}
          <Link href="/plans" className="underline hover:text-muted-foreground">
            Planos
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;

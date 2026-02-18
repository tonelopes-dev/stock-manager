import Link from "next/link";
import { InfoIcon, AlertTriangleIcon, AlertCircleIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

interface TrialBannerProps {
  subscriptionStatus: string | null;
  stripeCurrentPeriodEnd: Date | null;
}

const TrialBanner = ({ subscriptionStatus, stripeCurrentPeriodEnd }: TrialBannerProps) => {
  if (subscriptionStatus !== "TRIALING" || !stripeCurrentPeriodEnd) {
    return null;
  }

  const now = new Date();
  const end = new Date(stripeCurrentPeriodEnd);
  const diffMs = end.getTime() - now.getTime();

  // Timezone protection & final day logic
  if (diffMs <= 0) {
    return null;
  }

  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Determine severity and messaging
  let config = {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: <InfoIcon className="h-5 w-5 text-blue-500" />,
    message: `Você está no período de teste gratuito. Restam ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}.`,
    cta: "Ativar plano agora",
  };

  if (daysRemaining >= 3 && daysRemaining <= 7) {
    config = {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: <AlertTriangleIcon className="h-5 w-5 text-amber-500" />,
      message: `Seu teste termina em ${daysRemaining} dias.`,
      cta: "Ativar plano agora",
    };
  } else if (daysRemaining <= 2) {
    config = {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: <AlertCircleIcon className="h-5 w-5 text-red-500" />,
      message: `Seu teste termina em ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}. Evite a interrupção do acesso.`,
      cta: "Evitar interrupção",
    };
  }

  return (
    <div className={`${config.bg} border-b ${config.border} px-4 py-3 sm:px-6 lg:px-8`}>
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-3">
          {config.icon}
          <p className={`text-sm font-medium ${config.text}`}>
            {config.message}
          </p>
        </div>
        <div className="flex flex-shrink-0">
          <Button
            asChild
            size="sm"
            variant={daysRemaining <= 2 ? "destructive" : "default"}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <Link href="/plans">
              {config.cta}
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;

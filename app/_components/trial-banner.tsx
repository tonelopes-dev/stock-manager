import Link from "next/link";
import {
  InfoIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";

interface TrialBannerProps {
  subscriptionStatus: string | null;
  expiresAt: Date | null;
}

const TrialBanner = ({ subscriptionStatus, expiresAt }: TrialBannerProps) => {
  if (subscriptionStatus !== "TRIALING" || !expiresAt) {
    return null;
  }

  const now = new Date();
  const end = new Date(expiresAt);
  const diffMs = end.getTime() - now.getTime();

  // Timezone protection & final day logic
  if (diffMs <= 0) {
    return null;
  }

  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Determine severity and messaging
  let config = {
    bg: "bg-primary",
    border: "border-primary",
    text: "text-primary",
    icon: <InfoIcon className="h-5 w-5 text-primary" />,
    message: `Você está no período de teste gratuito. Restam ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}.`,
    cta: "Ativar plano agora",
  };

  if (daysRemaining === 2) {
    config = {
      bg: "bg-orange-500",
      border: "border-orange-500",
      text: "text-orange-500",
      icon: <AlertTriangleIcon className="h-5 w-5 text-orange-500" />,
      message: `Seu teste termina em ${daysRemaining} dias.`,
      cta: "Ativar plano agora",
    };
  } else if (daysRemaining <= 1) {
    config = {
      bg: "bg-destructive/10",
      border: "border-destructive/10",
      text: "text-destructive",
      icon: <AlertCircleIcon className="h-5 w-5 text-destructive" />,
      message: `Seu teste termina em ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}. Evite a interrupção do acesso.`,
      cta: "Evitar interrupção",
    };
  }

  return (
    <div
      className={`${config.bg} border-b ${config.border} px-4 py-3 sm:px-6 lg:px-8`}
    >
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

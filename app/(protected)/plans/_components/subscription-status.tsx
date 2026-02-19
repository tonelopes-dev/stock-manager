"use client";

import { Badge } from "@/app/_components/ui/badge";
import { AlertCircleIcon, CheckCircle2Icon, ClockIcon } from "lucide-react";

interface SubscriptionStatusProps {
  subscriptionStatus?: string | null;
}


export type SubStatus = "FREE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";

const configs: Record<
  SubStatus,
  {
    label: string;
    icon: React.ReactNode;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  FREE: {
    label: "Plano Gratuito",
    icon: null,
    variant: "secondary",
  },
  TRIALING: {
    label: "Teste Grátis",
    icon: <ClockIcon className="h-3 w-3" />,
    variant: "outline",
    className: "border-blue-400 text-blue-600 bg-blue-50",
  },
  ACTIVE: {
    label: "Assinatura Ativa",
    icon: <CheckCircle2Icon className="h-3 w-3" />,
    variant: "default",
    className: "bg-green-100 text-green-700 hover:bg-green-100 border-none",
  },
  PAST_DUE: {
    label: "Pagamento Pendente",
    icon: <AlertCircleIcon className="h-3 w-3" />,
    variant: "destructive",
  },
  CANCELED: {
    label: "Assinatura Cancelada",
    icon: <ClockIcon className="h-3 w-3" />,
    variant: "outline",
  },
  INCOMPLETE: {
    label: "Assinatura Incompleta",
    icon: <AlertCircleIcon className="h-3 w-3" />,
    variant: "outline",
  },
};

export const SubscriptionStatus = ({
  subscriptionStatus,
}: SubscriptionStatusProps) => {
  // Determine display status: prefer subscriptionStatus from DB (set by webhook)
  const status: SubStatus = (subscriptionStatus as SubStatus) ?? "FREE";

  const config = configs[status] ?? configs.FREE;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={config.variant}
        className={`flex items-center gap-1.5 px-3 py-1 ${config.className ?? ""}`}
      >
        {config.icon}
        {config.label}
      </Badge>
    </div>
  );
};

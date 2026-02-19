import { getSubscriptionUIState } from "@/app/_lib/subscription-utils";
import { SubscriptionStatus } from "@prisma/client";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRightIcon, CrownIcon } from "lucide-react";

interface SubscriptionPanelProps {
  status: SubscriptionStatus | null;
  periodEnd: Date | null;
}

const SubscriptionPanel = ({ status, periodEnd }: SubscriptionPanelProps) => {
  const uiState = getSubscriptionUIState(status, periodEnd);

  const severityStyles = {
    info: "bg-blue-50 border-blue-100 text-blue-700",
    warning: "bg-amber-50 border-amber-100 text-amber-700",
    danger: "bg-red-50 border-red-100 text-red-700",
    success: "bg-green-50 border-green-100 text-green-700",
    neutral: "bg-gray-50 border-gray-100 text-gray-700",
  };

  return (
    <div className={`rounded-lg border p-4 ${severityStyles[uiState.severity]}`}>

      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CrownIcon size={14} className={uiState.severity === "success" ? "text-green-600" : "text-gray-400"} />
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            {uiState.statusLabel}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold">
          {uiState.description}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          asChild
          variant={uiState.primaryCTA.variant}
          size="sm"
          className="h-8 w-full text-[10px] font-bold uppercase tracking-tight"
        >
          <Link href={uiState.primaryCTA.href}>
            {uiState.primaryCTA.label}
            <ArrowRightIcon size={12} className="ml-1" />
          </Link>
        </Button>

        {uiState.secondaryCTA && (
          <Link
            href={uiState.secondaryCTA.href}
            className="text-center text-[10px] font-medium opacity-60 hover:opacity-100 hover:underline"
          >
            {uiState.secondaryCTA.label}
          </Link>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPanel;

import { getPlanUsage } from "../_data-access/company/get-plan-usage";
import Link from "next/link";
import { ManageBillingButton } from "./manage-billing-button";
import { Badge } from "./ui/badge";

const PlanUsageWidget = async () => {
  const { productCount, maxProducts, percentage, stripeCustomerId, plan } = await getPlanUsage();

  return (
    <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Seu Plano
            </span>
            <Badge variant={plan === "PRO" ? "default" : "outline"} className="w-fit text-[10px] px-1.5 py-0">
                {plan}
            </Badge>
        </div>
        <span className="text-xs font-bold text-gray-500">
          {productCount} / {maxProducts}
        </span>
      </div>
      
      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            percentage > 90 ? "bg-red-500" : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="mt-4 flex items-center justify-between">
         {stripeCustomerId ? (
            <ManageBillingButton />
         ) : (
            <p className="text-[10px] text-gray-500 font-medium italic">
                {percentage >= 80 ? "Limite próximo!" : "Upgrade disponível"}
            </p>
         )}
         <Link href="/plans" className="text-[10px] font-bold text-primary hover:underline">
            {plan === "PRO" ? "Comparar" : "Ver Planos"}
         </Link>
      </div>
    </div>
  );
};

export default PlanUsageWidget;

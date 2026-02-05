import { getPlanUsage } from "../_data-access/company/get-plan-usage";

const PlanUsageWidget = async () => {
  const { productCount, maxProducts, percentage } = await getPlanUsage();

  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">
          Uso de Produtos
        </span>
        <span className="text-xs font-medium text-gray-500">
          {productCount} / {maxProducts}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage > 90 ? "bg-red-500" : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {percentage >= 80 && (
        <p className="mt-2 text-[10px] text-gray-500">
          Você está quase atingindo seu limite.
        </p>
      )}
    </div>
  );
};

export default PlanUsageWidget;

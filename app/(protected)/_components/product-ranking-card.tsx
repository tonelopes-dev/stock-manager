import { ProductRanking } from "@/app/_services/analytics";
import { formatCurrencyBR } from "./kpi-card";

interface ProductRankingCardProps {
  title: string;
  products: ProductRanking[];
  highlightType: "profit" | "margin";
}

export const ProductRankingCard = ({
  title,
  products,
  highlightType,
}: ProductRankingCardProps) => {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
          {title}
        </h3>
        <p className="text-sm text-slate-400 text-center py-8">
          Sem dados no período selecionado.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
      <div className="px-6 pt-5 pb-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
          {title}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Produto
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Receita
              </th>
              <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Lucro
              </th>
              <th className="text-right px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Margem %
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const isCriticalMargin = product.margin < 20;
              const isHighlightProfit = highlightType === "profit";

              return (
                <tr
                  key={product.productId}
                  className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/50"
                >
                  {/* Produto */}
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex-none w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {index + 1}
                      </span>
                      <span className="font-bold text-slate-900 truncate max-w-[180px]">
                        {product.productName}
                      </span>
                    </div>
                  </td>

                  {/* Receita */}
                  <td className="text-right px-4 py-3 font-medium text-slate-600 tabular-nums whitespace-nowrap">
                    {formatCurrencyBR(product.revenue)}
                  </td>

                  {/* Lucro */}
                  <td
                    className={`text-right px-4 py-3 font-bold tabular-nums whitespace-nowrap ${
                      isHighlightProfit
                        ? "text-emerald-600"
                        : product.profit >= 0
                          ? "text-slate-700"
                          : "text-rose-600"
                    }`}
                  >
                    {formatCurrencyBR(product.profit)}
                  </td>

                  {/* Margem % */}
                  <td className="text-right px-6 py-3 whitespace-nowrap">
                    {isCriticalMargin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                        {product.margin.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-slate-600 tabular-nums">
                        {product.margin.toFixed(2)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ProductRankingCardSkeleton = () => (
  <div className="rounded-xl border border-slate-200/80 bg-white p-6 animate-pulse">
    <div className="h-4 w-40 bg-slate-100 rounded mb-5" />
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-100 rounded" />
            <div className="h-4 w-28 bg-slate-100 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-12 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

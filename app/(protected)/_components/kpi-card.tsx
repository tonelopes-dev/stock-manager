import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
}

export const formatCurrencyBR = (value: number): string =>
  Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);

export const formatPercent = (value: number): string =>
  `${value.toFixed(2)}%`;

export const KpiCard = ({ title, value, subtitle, trend }: KpiCardProps) => {
  return (
    <div
      className="
        group relative overflow-hidden
        rounded-xl border border-slate-200/80 bg-white
        p-5
        transition-all duration-200 ease-out
        hover:border-primary/30 hover:shadow-md hover:shadow-primary/5
        hover:-translate-y-0.5
      "
    >
      {/* Title */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
        {title}
      </p>

      {/* Value */}
      <p className="text-2xl font-black text-slate-900 leading-none tracking-tight mb-1">
        {value}
      </p>

      {/* Subtitle (optional) */}
      {subtitle && (
        <p className="text-xs font-medium text-slate-500 mt-1">
          {subtitle}
        </p>
      )}

      {/* Trend (optional) */}
      {trend !== undefined && (
        <div
          className={`
            flex items-center gap-1 mt-2.5
            text-xs font-bold
            ${trend >= 0 ? "text-emerald-600" : "text-rose-600"}
          `}
        >
          {trend >= 0 ? (
            <ArrowUpIcon size={12} strokeWidth={3} />
          ) : (
            <ArrowDownIcon size={12} strokeWidth={3} />
          )}
          <span>{Math.abs(trend)}%</span>
          <span className="text-slate-400 font-medium ml-0.5">
            vs. período ant.
          </span>
        </div>
      )}

      {/* Decorative accent bar on hover */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-primary/60 to-primary/20 transition-all duration-300 group-hover:w-full" />
    </div>
  );
};

export const KpiCardSkeleton = () => (
  <div className="rounded-xl border border-slate-200/80 bg-white p-5 animate-pulse">
    <div className="h-3 w-20 bg-slate-100 rounded mb-4" />
    <div className="h-7 w-32 bg-slate-100 rounded mb-2" />
    <div className="h-3 w-24 bg-slate-100 rounded" />
  </div>
);

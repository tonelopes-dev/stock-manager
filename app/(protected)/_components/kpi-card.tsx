import { ArrowDownIcon, ArrowUpIcon, InfoIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  description?: string;
}

export const formatCurrencyBR = (value: number): string =>
  Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);

export const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

export const KpiCard = ({
  title,
  value,
  subtitle,
  trend,
  description,
}: KpiCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      {/* Title & Info Popover */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {title}
        </p>

        {description && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="cursor-pointer border-none text-slate-300 outline-none transition-colors hover:text-primary">
                <InfoIcon size={14} strokeWidth={2.5} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="max-w-[240px] border-slate-800 bg-slate-900 text-[11px] font-medium leading-relaxed text-white shadow-xl"
            >
              {description}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Value */}
      <p className="mb-1 text-2xl font-black leading-none tracking-tight text-slate-900">
        {value}
      </p>

      {/* Subtitle (optional) */}
      {subtitle && (
        <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>
      )}

      {/* Trend (optional) */}
      {trend !== undefined && (
        <div
          className={`mt-2.5 flex items-center gap-1 text-xs font-bold ${trend >= 0 ? "text-emerald-600" : "text-rose-600"} `}
        >
          {trend >= 0 ? (
            <ArrowUpIcon size={12} strokeWidth={3} />
          ) : (
            <ArrowDownIcon size={12} strokeWidth={3} />
          )}
          <span>{Math.abs(trend).toFixed(1)}%</span>
          <span className="ml-0.5 font-medium text-slate-400">
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
  <div className="animate-pulse rounded-xl border border-slate-200/80 bg-white p-5">
    <div className="mb-4 h-3 w-20 rounded bg-slate-100" />
    <div className="mb-2 h-7 w-32 rounded bg-slate-100" />
    <div className="h-3 w-24 rounded bg-slate-100" />
  </div>
);

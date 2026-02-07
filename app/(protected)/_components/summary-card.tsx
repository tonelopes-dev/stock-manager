import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Skeleton } from "@/app/_components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/app/_components/ui/popover";
import { cn } from "@/app/_lib/utils";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface SummaryCardProps {
  children: ReactNode;
  title: string;
  icon?: LucideIcon;
  trend?: number;
  info?: string;
}

export const SummaryCard = ({ children, title, icon: Icon, trend, info }: SummaryCardProps) => {
  const iconContent = Icon && (
    <div className={cn(
        "p-2 rounded-xl transition-all",
        info ? "bg-slate-50 hover:bg-slate-100 cursor-pointer text-primary" : "text-slate-400"
    )}>
        <Icon size={16} />
    </div>
  );

  return (
    <Card className="overflow-hidden border-slate-100 transition-hover hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </CardTitle>
        
        {Icon && (
            info ? (
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="outline-none border-none focus:ring-2 focus:ring-primary/20 rounded-xl transition-all">
                            {iconContent}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="max-w-[240px] text-xs font-medium leading-relaxed bg-slate-900 text-white border-slate-800 shadow-xl">
                        {info}
                    </PopoverContent>
                </Popover>
            ) : iconContent
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {children}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend >= 0 ? <ArrowUpIcon size={12} strokeWidth={3} /> : <ArrowDownIcon size={12} strokeWidth={3} />}
            <span>{Math.abs(trend)}%</span>
            <span className="text-slate-400 font-medium ml-0.5">vs. período ant.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const SummaryCardSkeleton = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-32" />
      </CardContent>
    </Card>
  );
};

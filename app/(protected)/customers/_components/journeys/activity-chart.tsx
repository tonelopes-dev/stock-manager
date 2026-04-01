"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityChartProps {
  data: { date: string; count: number }[];
}

export function JourneyActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="#f1f5f9"
          />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            minTickGap={32}
            tickFormatter={(value) => {
                try {
                    return format(parseISO(value), "dd MMM", { locale: ptBR });
                } catch {
                    return value;
                }
            }}
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
          />

          <YAxis hide domain={[0, "auto"]} allowDecimals={false} />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
          />

          <Area
            dataKey="count"
            type="monotone"
            fill="url(#fillCount)"
            fillOpacity={1}
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{
              r: 6,
              style: { fill: "#10b981", opacity: 1, stroke: "#fff", strokeWidth: 2 },
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const count = payload[0].value;
  const dateStr = label ? format(parseISO(label), "PPPP", { locale: ptBR }) : "";

  return (
    <div className="rounded-lg border border-border/80 bg-background px-4 py-3 shadow-xl shadow-slate-200/40">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
        {dateStr}
      </p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-sm font-black italic tracking-tighter text-foreground">
          {count} {count === 1 ? "tarefa concluída" : "tarefas concluídas"}
        </span>
      </div>
    </div>
  );
};

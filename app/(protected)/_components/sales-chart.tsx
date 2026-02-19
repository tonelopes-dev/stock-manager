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
import { formatCurrencyBR } from "./kpi-card";

// Matches the shape from getDailySalesChart → getDashboardAnalytics
export interface SalesChartDataPoint {
  date: string;
  revenue: number;
  cogs: number;
}

interface SalesChartProps {
  data: SalesChartDataPoint[];
}

// Pre-compute profit for each data point
function withProfit(data: SalesChartDataPoint[]) {
  return data.map((d) => ({
    ...d,
    profit: d.revenue - d.cogs,
  }));
}

// ── Custom Tooltip ──────────────────────────────────────

type Payload = { date: string; revenue: number; cogs: number; profit: number };

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0]?.payload as Payload | undefined;
  if (!row) return null;

  return (
    <div className="rounded-lg border border-slate-200/80 bg-white px-4 py-3 shadow-xl shadow-slate-200/40 min-w-[200px]">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
        {label}
      </p>
      <div className="space-y-1.5">
        <Row color="#6366f1" label="Receita" value={formatCurrencyBR(row.revenue)} />
        <Row color="#10b981" label="Lucro" value={formatCurrencyBR(row.profit)} />
        <Row color="#94a3b8" label="COGS" value={formatCurrencyBR(row.cogs)} />
      </div>
    </div>
  );
};

const Row = ({ color, label, value }: { color: string; label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
    <span className="text-xs font-black text-slate-900 tabular-nums">{value}</span>
  </div>
);

// ── Main Component ──────────────────────────────────────

export const SalesChart = ({ data }: SalesChartProps) => {
  const chartData = withProfit(data);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
      >
        <defs>
          <linearGradient id="salesFillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="salesFillProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
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
          tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
        />

        <YAxis hide domain={["auto", "auto"]} padding={{ top: 20, bottom: 20 }} />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
        />

        {/* Profit area (behind) */}
        <Area
          dataKey="profit"
          type="monotone"
          fill="url(#salesFillProfit)"
          fillOpacity={1}
          stroke="#10b981"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          activeDot={{
            r: 4,
            style: { fill: "#10b981", opacity: 1, stroke: "#fff", strokeWidth: 2 },
          }}
        />

        {/* Revenue area (front) */}
        <Area
          dataKey="revenue"
          type="monotone"
          fill="url(#salesFillRevenue)"
          fillOpacity={1}
          stroke="#6366f1"
          strokeWidth={3}
          dot={false}
          activeDot={{
            r: 5,
            style: { fill: "#6366f1", opacity: 1, stroke: "#fff", strokeWidth: 2 },
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

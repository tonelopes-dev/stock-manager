import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/_components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/app/_lib/utils";

interface Last14DaysRevenueCardProps {
  data: {
    date: string;
    revenue: number;
  }[];
}

const chartConfig = {
  revenue: {
    label: "Receita",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export const Last14DaysRevenueCard = ({ data }: Last14DaysRevenueCardProps) => {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{
          left: 0,
          right: 0,
          top: 10,
          bottom: 0
        }}
      >
        <defs>
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-revenue)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-revenue)"
              stopOpacity={0.01}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          minTickGap={32}
          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
        />
        <YAxis 
            hide
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              className="w-[180px] border-slate-100 shadow-xl"
              formatter={(value) => formatCurrency(Number(value))}
            />
          }
        />
        <Area
          dataKey="revenue"
          type="natural"
          fill="url(#fillRevenue)"
          fillOpacity={1}
          stroke="var(--color-revenue)"
          strokeWidth={3}
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
};

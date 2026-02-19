"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/app/_components/ui/chart";
import { formatCurrency } from "@/app/_lib/utils";

interface SalesChartsProps {
  comparison: {
    periodA: { name: string; revenue: number };
    periodB: { name: string; revenue: number };
  };
}

export const SalesCharts = ({ comparison }: SalesChartsProps) => {
  const { periodA, periodB } = comparison;
  
  // Data for Chart (A first as selected, B second as benchmark)
  const chartData = [
    { name: periodA.name, revenue: periodA.revenue, isCurrent: true },
    { name: periodB.name, revenue: periodB.revenue, isCurrent: false },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="border-slate-200 shadow-sm border-none bg-slate-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-black italic tracking-tighter uppercase text-slate-800">
            Diferencial de Performance
          </CardTitle>
          <CardDescription className="text-xs font-semibold text-slate-400 uppercase">
            Comparação direta de faturamento bruto entre períodos
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] pt-4">
            <ChartContainer 
                config={{ 
                    revenue: { label: "Receita", color: "hsl(var(--primary))" }
                }}
                className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 800 }}
                      dy={10}
                  />
                  <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }}
                      tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                  />
                  <ChartTooltip 
                    cursor={{ fill: 'transparent' }}
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} 
                  />
                  <Bar 
                      dataKey="revenue" 
                      radius={[10, 10, 0, 0]} 
                      barSize={80}
                      className="transition-all duration-500"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isCurrent ? "hsl(var(--primary))" : "#cbd5e1"} 
                        fillOpacity={entry.isCurrent ? 1 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

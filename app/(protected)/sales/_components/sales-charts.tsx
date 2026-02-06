"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/app/_components/ui/chart";

interface SalesChartsProps {
  monthlyComparison: { name: string; revenue: number }[];
}

export const SalesCharts = ({ monthlyComparison }: SalesChartsProps) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Comparison Chart */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-black italic tracking-tighter uppercase">Comparativo de Performance</CardTitle>
          <CardDescription>Análise detalhada entre os meses selecionados</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] pt-4 overflow-hidden">
            <ChartContainer 
                config={{ 
                    revenue: { label: "Receita", color: "hsl(var(--primary))" }
                }}
                className="h-full w-full aspect-auto"
            >
              <BarChart data={monthlyComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 800 }}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }}
                    tickFormatter={(value) => `R$ ${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))" 
                    radius={[6, 6, 0, 0]} 
                    barSize={60}
                />
              </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

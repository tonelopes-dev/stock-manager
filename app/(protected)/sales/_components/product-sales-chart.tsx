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
import { AggregatedSaleDto } from "@/app/_data-access/sale/get-aggregated-sales";

interface ProductSalesChartProps {
  data: AggregatedSaleDto[];
}

export const ProductSalesChart = ({ data }: ProductSalesChartProps) => {
  // Take top 10 products by quantity sold
  const chartData = [...data]
    .sort((a, b) => b.qtySold - a.qtySold)
    .slice(0, 10);

  return (
    <Card className="border-none bg-muted/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-foreground">
          Volume de Vendas por Produto
        </CardTitle>
        <CardDescription className="text-xs font-semibold uppercase text-muted-foreground">
          Top 10 produtos mais vendidos no período
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] pt-4">
        <ChartContainer
          config={{
            qtySold: { label: "Qtd Vendida", color: "hsl(var(--primary))" },
          }}
          className="h-full w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="productName"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b", fontWeight: 800 }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }}
              />
              <ChartTooltip
                cursor={{ fill: "transparent" }}
                content={<ChartTooltipContent />}
              />
              <Bar
                dataKey="qtySold"
                radius={[6, 6, 0, 0]}
                barSize={40}
                className="transition-all duration-500"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="hsl(var(--primary))"
                    fillOpacity={1 - index * 0.05} // Subtle gradient effect for ranking
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/_components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

interface Last14DaysRevenueCardProps {
  data: {
    day: string;
    totalRevenue: number;
  }[];
}

const chartConfig = {
  totalRevenue: {
    label: "Receita",
    color: "#2563eb",
  },
} satisfies ChartConfig;

export const Last14DaysRevenueCard = ({ data }: Last14DaysRevenueCardProps) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Receita</CardTitle>
          <p className="text-sm text-muted-foreground">Últimos 14 dias</p>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="totalRevenue"
                />
              }
            />
            <Bar dataKey="totalRevenue" fill="var(--color-totalRevenue)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

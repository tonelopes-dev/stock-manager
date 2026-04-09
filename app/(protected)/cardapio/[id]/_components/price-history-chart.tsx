"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUpIcon, DollarSignIcon } from "lucide-react";

interface PriceHistoryChartProps {
  stockEntries: any[];
}

const PriceHistoryChart = ({ stockEntries }: PriceHistoryChartProps) => {
  const chartData = useMemo(() => {
    // We need to sort by date ascending for the chart
    try {
      return [...(stockEntries || [])]
        .map((entry) => {
          const date = entry.createdAt ? new Date(entry.createdAt) : new Date(0);
          const price = Number(entry.unitCost) || 0;
          return {
            date,
            price: isFinite(price) ? price : 0,
            batch: entry.batchNumber || "-",
            supplier: entry.supplier?.name || "N/A",
          };
        })
        .filter((entry) => !isNaN(entry.date.getTime()))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((entry) => ({
          ...entry,
          formattedDate: format(entry.date, "dd/MM", { locale: ptBR }),
          fullDate: format(entry.date, "PPP", { locale: ptBR }),
        }));
    } catch (e) {
      console.error("Error processing chart data:", e);
      return [];
    }
  }, [stockEntries]);

  if (chartData.length < 2) {
    return (
      <Card className="border-none bg-white shadow-sm rounded-[2.5rem] overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-slate-400">
            <TrendingUpIcon size={32} />
          </div>
          <CardTitle className="text-lg">Histórico de Preços</CardTitle>
          <CardDescription>
            Histórico insuficiente para gerar análise de flutuação. 
            Registre novas compras para visualizar o gráfico.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const latestPrice = chartData[chartData.length - 1]?.price || 0;
  const initialPrice = chartData[0]?.price || 0;
  const diff = latestPrice - initialPrice;
  
  // Defensive logic for NaN (Divide by zero)
  const percentChange = initialPrice > 0 ? (diff / initialPrice) * 100 : 0;
  const isNew = initialPrice <= 0;

  return (
    <Card className="border-none bg-white shadow-sm rounded-[2.5rem] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-8">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-xl font-black">
            <TrendingUpIcon className="text-primary" size={20} />
            Flutuação de Preço
          </CardTitle>
          <CardDescription>Variação do custo unitário nos últimos 60 dias</CardDescription>
        </div>
        <div className={`flex flex-col items-end rounded-2xl p-3 px-4 ${isNew ? "bg-slate-100 text-slate-500" : diff > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
          <span className="text-xs font-bold uppercase tracking-wider opacity-70">Variação Total</span>
          <span className="text-lg font-black italic tracking-tight">
            {isNew ? "Novo" : `${diff > 0 ? "+" : ""}${(isNaN(percentChange) ? 0 : percentChange).toFixed(1)}%`}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                tickFormatter={(value) => `R$${value}`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const price = Number(data.price);
                    const isPriceValid = !isNaN(price) && isFinite(price);
                    return (
                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50">
                        <p className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">{data.fullDate}</p>
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <DollarSignIcon size={16} />
                          </div>
                          <div>
                            <p className="text-lg font-black text-slate-900">
                              {isPriceValid ? Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price) : "R$ 0,00"}
                            </p>
                            <p className="text-xs font-medium text-slate-500">Fornecedor: {data.supplier}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#4C1D95" // Deep Purple
                strokeWidth={4} 
                dot={{ fill: "#4C1D95", strokeWidth: 2, r: 4, stroke: "#fff" }}
                activeDot={{ r: 8, strokeWidth: 0, fill: "#4C1D95" }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceHistoryChart;

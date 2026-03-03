'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SalesBarChartProps {
  chartData: {
    name: string;
    Pagas: number;
    Pendentes: number;
  }[];
}

export function SalesBarChart({ chartData }: SalesBarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Formatador para o Tooltip do gráfico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg text-black">
          <p className="font-bold border-b mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isMounted) return <div className="h-[350px] w-full bg-muted/10 animate-pulse rounded-lg" />;

  const hasData = chartData.length > 0 && (chartData[0].Pagas > 0 || chartData[0].Pendentes > 0);

  return (
    <Card className="shadow-md border-primary/10 overflow-hidden my-6">
      <CardHeader className="pb-2 bg-primary/5 border-b">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Balanço de Vendas (Pagas vs. Pendentes)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="w-full h-[350px] min-h-[350px]">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Bar 
                  dataKey="Pagas" 
                  name="Vendas Pagas" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  isAnimationActive={false}
                />
                <Bar 
                  dataKey="Pendentes" 
                  name="A Receber" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
              <p>Nenhuma venda registrada para este período.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

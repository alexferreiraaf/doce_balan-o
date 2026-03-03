'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { formatCurrency, parseToNumber } from '@/lib/utils';

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

  if (!isMounted) {
    return <div className="w-full h-[350px] bg-muted/10 animate-pulse rounded-lg" />;
  }

  // Verifica se existem dados válidos para exibir
  const hasData = Array.isArray(chartData) && chartData.length > 0 && 
    chartData.some(d => parseToNumber(d.Pagas) > 0 || parseToNumber(d.Pendentes) > 0);

  return (
    <Card className="shadow-md border-primary/10 overflow-hidden my-6">
      <CardHeader className="pb-2 bg-primary/5 border-b">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Balanço de Vendas (Pagas vs. Pendentes)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="w-full h-[350px] flex items-center justify-center bg-card rounded-md">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: any) => [formatCurrency(parseToNumber(value)), ""]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar 
                  dataKey="Pagas" 
                  name="Vendas Recebidas" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  isAnimationActive={false}
                />
                <Bar 
                  dataKey="Pendentes" 
                  name="Vendas no Fiado" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                  isAnimationActive={false} 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <BarChart3 className="w-12 h-12 mb-3 opacity-20 text-primary" />
              <p className="font-bold">Nenhuma venda encontrada para este mês</p>
              <p className="text-xs max-w-[250px] mt-1">Seus lançamentos de entrada aparecerão aqui como barras coloridas assim que registrados.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { parseToNumber, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

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

  // Evita erro de hidratação no Next.js
  if (!isMounted) {
    return (
      <Card className="w-full shadow-md border-primary/10">
        <div style={{ height: '350px' }} className="w-full bg-muted/10 animate-pulse" />
      </Card>
    );
  }

  // Verifica se há dados reais para desenhar as barras
  const hasData = Array.isArray(chartData) && chartData.length > 0 && 
    (parseToNumber(chartData[0]?.Pagas) > 0 || parseToNumber(chartData[0]?.Pendentes) > 0);

  return (
    <Card className="w-full shadow-md border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Desempenho de Vendas (Mensal)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Legend iconType="circle" />
                <Bar 
                  dataKey="Pagas" 
                  name="Receitas Pagas"
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={60}
                />
                <Bar 
                  dataKey="Pendentes" 
                  name="Vendas a Prazo"
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                  barSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg space-y-2">
              <BarChart3 className="w-12 h-12 opacity-20" />
              <p className="font-medium text-sm">Nenhuma venda registrada para este período.</p>
              <p className="text-xs">As barras aparecerão assim que você realizar uma venda.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

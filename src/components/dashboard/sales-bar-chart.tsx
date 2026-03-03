'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp } from 'lucide-react';

interface SalesBarChartProps {
  chartData: any[];
}

export function SalesBarChart({ chartData }: SalesBarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[350px] w-full bg-muted/10 animate-pulse rounded-lg" />;
  }

  const hasData = chartData && chartData.length > 0 && (chartData[0].Pagas > 0 || chartData[0].Pendentes > 0);

  return (
    <Card className="shadow-md border-primary/10 overflow-hidden">
      <CardHeader className="pb-2 bg-muted/5 border-b">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Resumo de Vendas (Balanço do Mês)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8">
        <div className="w-full" style={{ height: '350px' }}>
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#888', opacity: 0.5 }}
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={{ stroke: '#888', opacity: 0.5 }}
                  tick={{ fill: 'currentColor', fontSize: 11 }}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #ddd' }}
                />
                <Legend verticalAlign="top" height={40}/>
                <Bar 
                  dataKey="Pagas" 
                  name="Recebido" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={60}
                />
                <Bar 
                  dataKey="Pendentes" 
                  name="A Receber" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                  barSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
              <TrendingUp className="w-16 h-16 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-bold uppercase tracking-wider">Aguardando Lançamentos</p>
                <p className="text-xs text-muted-foreground">Nenhuma venda encontrada para o período selecionado.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

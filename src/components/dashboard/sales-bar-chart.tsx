'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
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
      <CardContent className="pt-8 px-2 sm:px-6">
        <div className="w-full h-[300px] min-h-[300px] flex items-center justify-center">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#888' }} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={{ stroke: '#888' }} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 11 }}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend verticalAlign="top" align="center" height={36} iconType="circle" />
                <Bar 
                  dataKey="Pagas" 
                  name="Vendas Recebidas"
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={60}
                  isAnimationActive={false}
                >
                   <LabelList dataKey="Pagas" position="top" formatter={(val: number) => val > 0 ? formatCurrency(val) : ''} style={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                </Bar>
                <Bar 
                  dataKey="Pendentes" 
                  name="Vendas no Fiado"
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                  barSize={60}
                  isAnimationActive={false}
                >
                   <LabelList dataKey="Pendentes" position="top" formatter={(val: number) => val > 0 ? formatCurrency(val) : ''} style={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
              <div className="relative">
                <TrendingUp className="w-16 h-16 text-muted-foreground" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
              </div>
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

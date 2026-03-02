'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    return <div className="h-[300px] w-full bg-muted/5 animate-pulse rounded-lg" />;
  }

  return (
    <Card className="shadow-md border-primary/10 overflow-hidden">
      <CardHeader className="pb-2 bg-muted/10 border-b">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Resumo Financeiro de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 px-2 sm:px-6">
        <div className="w-full h-[300px] min-h-[300px]">
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#666' }} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={{ stroke: '#666' }} 
                  tickLine={false} 
                  width={70} 
                  tick={{ fill: '#888', fontSize: 11 }}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                />
                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                <Bar 
                  dataKey="Pagas" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={50} 
                  isAnimationActive={false} 
                />
                <Bar 
                  dataKey="Pendentes" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                  barSize={50} 
                  isAnimationActive={false} 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
              <TrendingUp className="w-12 h-12 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-bold uppercase">Sem vendas registradas</p>
                <p className="text-xs">Navegue pelos meses para ver seu desempenho.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

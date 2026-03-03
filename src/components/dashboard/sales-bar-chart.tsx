'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

interface SalesBarChartProps {
  chartData: any[];
}

export function SalesBarChart({ chartData }: SalesBarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Garante que o gráfico só tente desenhar após a página carregar no navegador
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[300px] w-full bg-muted/10 animate-pulse rounded-lg" />;
  }

  return (
    <Card className="shadow-md border-primary/10 overflow-hidden">
      <CardHeader className="pb-2 bg-muted/5 border-b">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Balanço Geral do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Forcei uma altura fixa de 300px para garantir que ele apareça na tela */}
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
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
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: '1px solid #ddd' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Bar 
                dataKey="Pagas" 
                name="Vendas Pagas" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                barSize={50}
                animationDuration={500}
              />
              <Bar 
                dataKey="Pendentes" 
                name="A Receber (Fiado)" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]} 
                barSize={50}
                animationDuration={500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

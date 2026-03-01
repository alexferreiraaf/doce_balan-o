'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp } from 'lucide-react';

interface SalesBarChartProps {
  data: {
    paid: number;
    pending: number;
  };
}

export function SalesBarChart({ data }: SalesBarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prepara os dados exatamente como a lógica sugerida (Gemini)
  const chartData = (data.paid > 0 || data.pending > 0) ? [
    {
      name: 'Resumo de Vendas',
      'Vendas Pagas': Number(data.paid.toFixed(2)),
      'A Receber (Fiado)': Number(data.pending.toFixed(2)),
    }
  ] : [];

  if (!isMounted) {
    return <div className="h-[300px] w-full bg-muted/10 animate-pulse rounded-lg" />;
  }

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="pb-2 bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Resumo Financeiro de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px] w-full min-h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  width={80} 
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" verticalAlign="top" align="right" height={36}/>
                <Bar 
                  dataKey="Vendas Pagas" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                  barSize={60}
                  isAnimationActive={false} 
                />
                <Bar 
                  dataKey="A Receber (Fiado)" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]}
                  barSize={60}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
              <TrendingUp className="w-16 h-16 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Aguardando Lançamentos</p>
                <p className="text-xs">As barras aparecerão aqui assim que houver vendas no mês.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

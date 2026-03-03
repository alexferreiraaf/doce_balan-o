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
    return <div className="h-[350px] w-full bg-muted/10 animate-pulse rounded-lg" />;
  }

  // Verifica se realmente existem valores para mostrar as barras
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
        <div className="w-full flex items-center justify-center min-h-[300px]">
          {hasData ? (
            /* Usando ResponsiveContainer com altura fixa no pai para garantir visibilidade */
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#888', fontSize: 12 }} 
                    axisLine={{ stroke: '#888', opacity: 0.5 }}
                  />
                  <YAxis 
                    tick={{ fill: '#888', fontSize: 11 }}
                    axisLine={{ stroke: '#888', opacity: 0.5 }}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar 
                    dataKey="Pagas" 
                    name="Vendas Recebidas" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    barSize={50}
                  />
                  <Bar 
                    dataKey="Pendentes" 
                    name="Vendas no Fiado" 
                    fill="#f59e0b" 
                    radius={[4, 4, 0, 0]} 
                    barSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4 opacity-40">
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

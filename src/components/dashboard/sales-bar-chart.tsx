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

  // Previne erros de hidratação
  if (!isMounted) {
    return <div className="w-full h-[350px] bg-muted/10 animate-pulse rounded-lg" />;
  }

  // Verifica se temos dados reais para exibir (totais > 0)
  const hasData = Array.isArray(chartData) && 
                  chartData.length > 0 && 
                  chartData[0] && 
                  (Number(chartData[0].Pagas || 0) > 0 || Number(chartData[0].Pendentes || 0) > 0);

  return (
    <Card className="shadow-md border-primary/10 overflow-hidden my-6">
      <CardHeader className="pb-2 bg-primary/5 border-b">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Balanço de Vendas (Pagas vs. Pendentes)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Forçamos uma altura fixa para evitar que o ResponsiveContainer colapse para 0 */}
        <div className="w-full h-[350px] min-h-[350px] relative">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888"
                  fontSize={14}
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
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
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5">
              <BarChart3 className="w-12 h-12 mb-2 opacity-20 text-primary" />
              <p className="font-bold">Aguardando lançamentos...</p>
              <p className="text-xs">As barras aparecerão quando houver vendas no período selecionado.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

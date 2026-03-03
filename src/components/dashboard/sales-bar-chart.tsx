'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { parseToNumber } from '@/lib/utils';

interface SalesBarChartProps {
  chartData: {
    name: string;
    Pagas: number;
    Pendentes: number;
  }[];
}

/**
 * Gráfico ultra-reduzido e simplificado para evitar conflitos de renderização.
 * Altura fixa de 150px e sem elementos decorativos.
 */
export function SalesBarChart({ chartData }: SalesBarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Verifica se existem dados válidos para exibir
  const hasData = Array.isArray(chartData) && chartData.length > 0 && 
    chartData.some(d => parseToNumber(d.Pagas) > 0 || parseToNumber(d.Pendentes) > 0);

  if (!hasData) return null;

  return (
    <div className="w-full bg-card rounded-md border p-2 my-2" style={{ height: '150px' }}>
      <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase text-center">Desempenho de Vendas</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Bar 
            dataKey="Pagas" 
            fill="#10b981" 
            radius={[2, 2, 0, 0]} 
            isAnimationActive={false}
          />
          <Bar 
            dataKey="Pendentes" 
            fill="#f59e0b" 
            radius={[2, 2, 0, 0]} 
            isAnimationActive={false} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

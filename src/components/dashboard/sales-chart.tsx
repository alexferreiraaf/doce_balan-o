'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface SalesChartProps {
  transactions: Transaction[];
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export function SalesChart({ transactions }: SalesChartProps) {
  const chartData = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);
      
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const data = [
      { name: 'Receitas', value: income },
      { name: 'Despesas', value: expense },
    ];
    
    // Don't show chart if there's no data
    if (income === 0 && expense === 0) {
        return [];
    }

    return data;
  }, [transactions]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md border bg-background p-2 shadow-sm">
          <p className="font-bold">{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="flex justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const Icon = entry.value === 'Receitas' ? TrendingUp : TrendingDown;
          return (
          <li key={`item-${index}`} className={`flex items-center gap-2 text-sm text-muted-foreground`}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.value}: {formatCurrency(chartData.find(d => d.name === entry.value)?.value || 0)}
          </li>
        )})}
      </ul>
    );
  };


  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Balanço Geral (Receitas vs Despesas)</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />}/>
              </PieChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <p>Ainda não há dados suficientes para exibir o gráfico.</p>
                <p className="text-sm">Registre suas receitas e despesas para começar.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

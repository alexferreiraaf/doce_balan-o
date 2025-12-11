'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { format, eachDayOfInterval } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];
    
    const minDate = Math.min(...transactions.map(t => t.dateMs));
    const maxDate = Math.max(...transactions.map(t => t.dateMs));
    
    const dateInterval = eachDayOfInterval({
        start: new Date(minDate),
        end: new Date(maxDate)
    });

    const dailyData = new Map<string, { income: number; expense: number }>();
    
    dateInterval.forEach(day => {
        const formattedDate = format(day, 'dd/MM');
        dailyData.set(formattedDate, { income: 0, expense: 0 });
    });

    transactions.forEach(t => {
      const date = format(new Date(t.dateMs), 'dd/MM');
      const dayData = dailyData.get(date) || { income: 0, expense: 0 };
      if (t.type === 'income' && t.status === 'paid') {
        dayData.income += t.amount;
      } else if (t.type === 'expense') {
        dayData.expense += t.amount;
      }
      dailyData.set(date, dayData);
    });

    return Array.from(dailyData.entries()).map(([date, { income, expense }]) => ({
      date,
      Receitas: income,
      Despesas: expense,
    }));
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receitas vs. Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                }}
                formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="Receitas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Sem dados para exibir no período selecionado.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

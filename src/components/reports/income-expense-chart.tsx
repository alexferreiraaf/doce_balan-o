'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];
    
    const dailyData = new Map<string, { income: number; expense: number }>();

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

    const sortedDates = Array.from(dailyData.keys()).sort((a, b) => {
        const [dayA, monthA] = a.split('/').map(Number);
        const [dayB, monthB] = b.split('/').map(Number);
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
    });

    return sortedDates.map(date => ({
      date,
      Receitas: dailyData.get(date)?.income || 0,
      Despesas: dailyData.get(date)?.expense || 0,
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

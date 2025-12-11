'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
  startDate: Date;
  endDate: Date;
}

export function IncomeExpenseChart({ transactions, startDate, endDate }: IncomeExpenseChartProps) {
  const chartData = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return [];

    const dateInterval = eachDayOfInterval({
        start: startOfDay(startDate),
        end: startOfDay(endDate),
    });

    const dailyData = new Map<string, { income: number; expense: number }>();

    // Initialize all days in the interval with zero values
    dateInterval.forEach(day => {
        const dateKey = format(day, 'dd/MM');
        dailyData.set(dateKey, { income: 0, expense: 0 });
    });
    
    // Populate with actual transaction data
    transactions.forEach(t => {
      const dateKey = format(new Date(t.dateMs), 'dd/MM');
      const dayData = dailyData.get(dateKey);

      if (dayData) {
        if (t.type === 'income' && t.status === 'paid') {
          dayData.income += t.amount;
        } else if (t.type === 'expense') {
          dayData.expense += t.amount;
        }
        dailyData.set(dateKey, dayData);
      }
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      Receitas: data.income,
      Despesas: data.expense,
    }));
  }, [transactions, startDate, endDate]);

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
                <Legend />
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

'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';

interface SalesChartProps {
  transactions: Transaction[];
}

export function SalesChart({ transactions }: SalesChartProps) {
  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), i));
    
    const data = last30Days.map(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      const dayTransactions = transactions.filter(t => format(t.dateMs, 'yyyy-MM-dd') === dateString);

      const income = dayTransactions
        .filter(t => t.type === 'income' && t.status === 'paid')
        .reduce((acc, t) => acc + t.amount, 0);
      
      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        date: format(date, 'dd/MM'),
        Receitas: income,
        Despesas: expense,
      };
    }).reverse(); // Reverse to show oldest to newest

    return data;
  }, [transactions]);

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Receitas vs. Despesas (Últimos 30 Dias)</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ fontWeight: 'bold' }}
              wrapperClassName="rounded-md border bg-background p-2 shadow-sm"
            />
            <Bar dataKey="Receitas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Despesas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';

interface ExpenseCategoryChartProps {
  transactions: Transaction[];
}

const COLORS = [
    'hsl(var(--chart-4))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-1))',
    'hsl(var(--chart-5))',
];

export function ExpenseCategoryChart({ transactions }: ExpenseCategoryChartProps) {
  const expenseByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const categoryTotals = expenses.reduce((acc, t) => {
      const category = t.category || 'Outros Gastos';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        {expenseByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
                cornerRadius={8}
              >
                {expenseByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <p>Sem dados de despesas para exibir no período.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

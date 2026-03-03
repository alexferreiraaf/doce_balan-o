'use client';

import { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, parseToNumber } from '@/lib/utils';
import { Tag } from 'lucide-react';

interface ExpenseCategoryChartProps {
  transactions: Transaction[];
}

const COLORS = ['#D946EF', '#8B5CF6', '#6366F1', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export function ExpenseCategoryChart({ transactions }: ExpenseCategoryChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const grouped = expenses.reduce((acc, t) => {
      const category = t.category || 'Outros';
      const amount = parseToNumber(t.amount);
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (!isMounted) return <div className="h-[300px] w-full bg-muted animate-pulse rounded-lg" />;

  const hasData = chartData.length > 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Tag className="w-5 h-5 text-primary" />
          Gastos por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full flex items-center justify-center">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center space-y-2 opacity-40">
              <Tag className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Sem despesas no período</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

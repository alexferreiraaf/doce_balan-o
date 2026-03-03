'use client';

import { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, parseToNumber } from '@/lib/utils';
import { PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface SalesChartProps {
  transactions: Transaction[];
}

const COLORS = [
  '#10b981', // Verde - Receitas Pagas
  '#f59e0b', // Amarelo - A Receber
  '#ef4444', // Vermelho - Despesas
];

export function SalesChart({ transactions }: SalesChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    let paidIncome = 0;
    let pendingIncome = 0;
    let expenses = 0;

    transactions.forEach((t) => {
      const amount = parseToNumber(t.amount);
      const downPayment = parseToNumber(t.downPayment);

      if (t.type === 'income') {
        const isPaid = t.status === 'paid' || (t.paymentMethod !== 'fiado' && t.paymentMethod !== null);
        
        if (isPaid) {
          paidIncome += amount;
        } else {
          paidIncome += downPayment;
          pendingIncome += (amount - downPayment);
        }
      } else if (t.type === 'expense') {
        expenses += amount;
      }
    });

    const data = [];
    if (paidIncome > 0) data.push({ name: 'Receitas Pagas', value: Number(paidIncome.toFixed(2)) });
    if (pendingIncome > 0) data.push({ name: 'A Receber', value: Number(pendingIncome.toFixed(2)) });
    if (expenses > 0) data.push({ name: 'Despesas', value: Number(expenses.toFixed(2)) });

    return data;
  }, [transactions]);

  if (!isMounted) return <div className="h-[300px] w-full bg-muted animate-pulse rounded-lg" />;

  const hasData = chartData.length > 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChartIcon className="w-5 h-5 text-primary" />
          Balanço do Período
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
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
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
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Sem dados no período</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

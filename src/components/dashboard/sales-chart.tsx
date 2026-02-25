'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { PieChart as PieChartIcon } from 'lucide-react';

interface SalesChartProps {
  transactions: Transaction[];
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.7rem] uppercase text-muted-foreground">
              {payload[0].name}
            </span>
            <span className="font-bold text-muted-foreground">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export function SalesChart({ transactions }: SalesChartProps) {
  const chartData = useMemo(() => {
    const paidIncome = transactions
      .filter((t) => t.type === 'income' && (t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado')))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const pendingIncome = transactions
      .filter((t) => t.type === 'income' && (t.status === 'pending' || (!t.status && t.paymentMethod === 'fiado')))
      .reduce((sum, t) => sum + (Number(t.amount || 0) - Number(t.downPayment || 0)), 0);
      
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const data = [];
    if (paidIncome > 0) data.push({ name: 'Receitas Pagas', value: paidIncome });
    if (pendingIncome > 0) data.push({ name: 'A Receber', value: pendingIncome });
    if (expense > 0) data.push({ name: 'Despesas', value: expense });

    return data;
  }, [transactions]);

  const hasData = chartData.some(d => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-muted-foreground" />
          Balanço Geral
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="opacity-50"
                >
                  <path d="M50 5 a 45 45 0 0 1 0 90 a 45 45 0 0 1 0 -90" stroke="hsl(var(--border))" strokeWidth="10" fill="none"/>
                  <path d="M50 5 a 45 45 0 0 1 38.97 22.5" stroke="hsl(var(--muted-foreground))" strokeWidth="10" fill="none"/>
                </svg>
              <p className="mt-2 text-sm">Sem dados para o gráfico</p>
              <p className="text-xs">Registre transações para visualizar o balanço.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';
import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 backdrop-blur-sm p-2 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-green-500">{`Receita: ${formatCurrency(payload[0].value)}`}</p>
          <p className="text-red-500">{`Despesa: ${formatCurrency(payload[1].value)}`}</p>
        </div>
      );
    }
  
    return null;
  };

interface IncomeExpenseChartProps {
    transactions: Transaction[];
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const data = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        income: 0,
        expense: 0,
      };
    }).reverse();

    transactions.forEach((t) => {
      const transactionDate = t.timestamp.toDate();
      const monthIndex = months.findIndex(
        (m) => m.year === transactionDate.getFullYear() && m.month === transactionDate.getMonth()
      );
      if (monthIndex !== -1) {
        if (t.type === 'income') {
          months[monthIndex].income += t.amount;
        } else {
          months[monthIndex].expense += t.amount;
        }
      }
    });

    return months;
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 md:h-80 text-muted-foreground">
        <p>Sem dados para exibir o gráfico.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$${Number(value) / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--muted), 0.5)' }} />
          <Legend wrapperStyle={{fontSize: "0.8rem"}} />
          <Bar dataKey="income" name="Receitas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Despesas" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

import { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface SalesChartProps {
  transactions: Transaction[];
}

const COLORS = [
  '#10b981', // Verde - Receitas Pagas
  '#f59e0b', // Amarelo - A Receber
  '#ef4444', // Vermelho - Despesas
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <div className="flex flex-col space-y-1">
          <span className="text-[0.7rem] uppercase font-bold text-muted-foreground">
            {payload[0].name}
          </span>
          <span className="font-bold text-primary">
            {formatCurrency(Number(payload[0].value) || 0)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

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
      const amount = Number(t.amount) || 0;
      const downPayment = Number(t.downPayment) || 0;

      if (t.type === 'income') {
        // Regra unificada: é pago se status for 'paid' OU se for transação antiga não-fiado
        const isPaid = t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado');
        
        if (isPaid) {
          paidIncome += amount;
        } else {
          // Se for fiado/pendente, o que foi pago de entrada entra como Receita Paga
          // O restante entra como A Receber
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

  const hasData = chartData.length > 0;

  return (
    <Card className="h-full border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChartIcon className="w-5 h-5 text-primary" />
          Balanço do Período
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full flex items-center justify-center">
          {isMounted && hasData ? (
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
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-medium text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-32 h-32 opacity-20">
                <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray="180 100" />
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray="60 200" strokeDashoffset="-190" />
                  <path d="M50 50 L50 10 M50 50 L85 70" stroke="currentColor" strokeWidth="2" />
                </svg>
                <TrendingUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Sem dados no período</p>
                <p className="text-xs text-muted-foreground/70">As vendas aparecerão aqui automaticamente.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

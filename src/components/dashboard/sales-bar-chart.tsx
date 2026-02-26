'use client';

import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp } from 'lucide-react';

interface SalesBarChartProps {
  transactions: Transaction[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md border-primary/20">
        <p className="text-sm font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between gap-4 text-xs">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>
            <span className="font-bold">
              {formatCurrency(Number(entry.value) || 0)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function SalesBarChart({ transactions }: SalesBarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    let paidIncome = 0;
    let pendingIncome = 0;
    let expenses = 0;

    transactions.forEach((t) => {
      // Conversão ultra-segura para número (evita erros com dados legados)
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : (Number(t.amount) || 0);
      const downPayment = typeof t.downPayment === 'string' ? parseFloat(t.downPayment) : (Number(t.downPayment) || 0);

      if (t.type === 'income') {
        // Lógica unificada de pagamento: status 'paid' OU transação antiga não-fiado
        const isPaid = t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado');
        
        if (isPaid) {
          paidIncome += amount;
        } else {
          // Para pendentes, a entrada já é considerada receita paga
          paidIncome += downPayment;
          pendingIncome += (amount - downPayment);
        }
      } else if (t.type === 'expense') {
        expenses += amount;
      }
    });

    // Só exibe no gráfico se houver algum valor maior que zero
    if (paidIncome === 0 && pendingIncome === 0 && expenses === 0) return [];

    return [
      {
        name: 'Balanço Geral',
        'Receitas Pagas': Number(paidIncome.toFixed(2)),
        'A Receber': Number(pendingIncome.toFixed(2)),
        'Despesas': Number(expenses.toFixed(2)),
      }
    ];
  }, [transactions]);

  const hasData = chartData.length > 0;

  return (
    <Card className="h-full shadow-md border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Fluxo Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full flex items-center justify-center">
          {isMounted && hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Bar name="Receitas Pagas" dataKey="Receitas Pagas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="A Receber" dataKey="A Receber" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar name="Despesas" dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
              <div className="relative w-32 h-32 opacity-20 group">
                <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
                  <rect x="10" y="60" width="20" height="30" fill="currentColor" />
                  <rect x="40" y="40" width="20" height="50" fill="currentColor" />
                  <rect x="70" y="20" width="20" height="70" fill="currentColor" />
                  <path d="M5 90 H95" stroke="currentColor" strokeWidth="2" />
                </svg>
                <TrendingUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground">Aguardando Lançamentos</p>
                <p className="text-xs text-muted-foreground/60 max-w-[200px]">As barras de entradas e saídas aparecerão aqui assim que você registrar uma venda ou gasto.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

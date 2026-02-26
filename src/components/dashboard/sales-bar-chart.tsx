
'use client';

import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, parseToNumber } from '@/lib/utils';
import { BarChart3, TrendingUp } from 'lucide-react';

interface SalesBarChartProps {
  transactions: Transaction[];
}

export function SalesBarChart({ transactions }: SalesBarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    let paidTotal = 0;
    let pendingTotal = 0;

    transactions.forEach((t) => {
      if (t.type !== 'income') return;

      const amount = parseToNumber(t.amount);
      const downPayment = parseToNumber(t.downPayment);

      // Regra: É pago se status for 'paid' OU se for uma transação sem status que não seja 'fiado'
      const isPaid = t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado');
      
      if (isPaid) {
        paidTotal += amount;
      } else {
        // Se for fiado ou pendente, a entrada já é considerada "Paga"
        paidTotal += downPayment;
        // O resto é o que falta receber
        pendingTotal += (amount - downPayment);
      }
    });

    if (paidTotal === 0 && pendingTotal === 0) return [];

    // Estrutura de dados simples como a sugerida: cada barra é um objeto na lista
    return [
      {
        name: 'Vendas Pagas',
        valor: Number(paidTotal.toFixed(2)),
        color: '#10b981', // Verde
      },
      {
        name: 'A Receber (Fiado)',
        valor: Number(pendingTotal.toFixed(2)),
        color: '#f59e0b', // Amarelo/Laranja
      }
    ];
  }, [transactions]);

  if (!isMounted) {
    return <div className="h-[300px] w-full bg-muted/10 animate-pulse rounded-lg" />;
  }

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Resumo de Vendas do Período
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full pt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 30, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--primary))', opacity: 0.05 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-lg border-primary/20">
                          <p className="text-xs font-bold mb-1 uppercase text-muted-foreground">{payload[0].payload.name}</p>
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(Number(payload[0].value) || 0)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList 
                    dataKey="valor" 
                    position="top" 
                    formatter={(val: number) => formatCurrency(val)}
                    style={{ fontSize: '12px', fontWeight: 'bold', fill: 'hsl(var(--foreground))' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
              <TrendingUp className="w-16 h-16 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground">Sem vendas registradas neste período</p>
                <p className="text-xs max-w-[250px]">As barras de desempenho aparecerão aqui assim que houver lançamentos.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

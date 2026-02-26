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
      // Focar apenas no que foi vendido (entradas)
      if (t.type !== 'income') return;

      const amount = parseToNumber(t.amount);
      const downPayment = parseToNumber(t.downPayment);

      const isPaid = t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado');
      
      if (isPaid) {
        paidTotal += amount;
      } else {
        // Se for fiado ou pendente, o que foi pago de entrada entra como Pago
        // O restante entra como Pendente
        paidTotal += downPayment;
        pendingTotal += (amount - downPayment);
      }
    });

    if (paidTotal <= 0 && pendingTotal <= 0) return [];

    // Criamos dois itens separados para garantir que o Recharts desenhe as barras corretamente
    return [
      {
        name: 'Vendas Pagas',
        valor: Number(paidTotal.toFixed(2)),
        color: '#10b981',
      },
      {
        name: 'A Receber (Fiado)',
        valor: Number(pendingTotal.toFixed(2)),
        color: '#f59e0b',
      }
    ];
  }, [transactions]);

  const hasData = chartData.length > 0;

  if (!isMounted) {
    return <div className="h-72 w-full bg-muted/10 animate-pulse rounded-lg" />;
  }

  return (
    <Card className="h-full shadow-md border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Resumo de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full flex items-center justify-center pt-4">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--primary))', opacity: 0.05 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md border-primary/20">
                          <p className="text-xs font-bold mb-1">{payload[0].payload.name}</p>
                          <p className="text-sm font-bold text-primary">
                            {formatCurrency(Number(payload[0].value) || 0)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={80}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList 
                    dataKey="valor" 
                    position="top" 
                    formatter={(val: number) => formatCurrency(val)}
                    style={{ fontSize: '10px', fontWeight: 'bold', fill: 'hsl(var(--foreground))' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
              <div className="relative w-32 h-32 opacity-20">
                <TrendingUp className="w-full h-full text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground">Aguardando Vendas</p>
                <p className="text-xs text-muted-foreground/60 max-w-[200px]">As barras de vendas aparecerão aqui assim que houver registros no período.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

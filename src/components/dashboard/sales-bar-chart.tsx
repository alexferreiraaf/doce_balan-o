'use client';

import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
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

      // Regra de pagamento: é pago se status for 'paid' ou se não for fiado
      const isPaid = t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado');
      
      if (isPaid) {
        paidTotal += amount;
      } else {
        paidTotal += downPayment;
        pendingTotal += (amount - downPayment);
      }
    });

    if (paidTotal === 0 && pendingTotal === 0) return [];

    // Estrutura simplificada conforme sua sugestão (um único objeto com chaves diferentes)
    return [
      {
        name: 'Resumo',
        Pagas: Number(paidTotal.toFixed(2)),
        Pendentes: Number(pendingTotal.toFixed(2)),
      }
    ];
  }, [transactions]);

  if (!isMounted) return <div className="h-[300px] w-full bg-muted/10 animate-pulse rounded-lg" />;

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Gráfico de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full pt-4 min-h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={true} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #eee' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Pagas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={50}>
                    <LabelList dataKey="Pagas" position="top" formatter={(v: any) => formatCurrency(v)} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                </Bar>
                <Bar dataKey="Pendentes" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={50}>
                    <LabelList dataKey="Pendentes" position="top" formatter={(v: any) => formatCurrency(v)} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
              <TrendingUp className="w-16 h-16 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground">Nenhuma venda encontrada para este mês</p>
                <p className="text-xs">O gráfico aparecerá aqui assim que houver lançamentos.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

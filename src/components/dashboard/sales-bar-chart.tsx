
'use client';

import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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

      // Regra de negócio: Consideramos pago se o status for 'paid' ou se não for fiado
      const isPaid = t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado');
      
      if (isPaid) {
        paidTotal += amount;
      } else {
        // Se for pendente/fiado, a entrada já é receita paga, o resto é pendente
        paidTotal += downPayment;
        pendingTotal += (amount - downPayment);
      }
    });

    // Se não houver vendas, retornamos vazio para mostrar o desenho de "sem dados"
    if (paidTotal <= 0 && pendingTotal <= 0) return [];

    // Estrutura de dados conforme a sugestão do usuário para Recharts
    return [
      {
        name: 'Resumo de Vendas',
        Pagas: Number(paidTotal.toFixed(2)),
        Pendentes: Number(pendingTotal.toFixed(2)),
      }
    ];
  }, [transactions]);

  // Evita erros de hidratação no Next.js
  if (!isMounted) return <div className="h-[350px] w-full bg-muted/10 animate-pulse rounded-lg" />;

  return (
    <Card className="shadow-md border-primary/10 overflow-hidden">
      <CardHeader className="pb-2 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Desempenho de Vendas do Período
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  axisLine={true} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${value}`}
                  axisLine={true}
                  tickLine={false}
                  tick={{ fill: 'currentColor', fontSize: 10 }}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Legend iconType="rect" verticalAlign="top" align="right" height={36}/>
                <Bar 
                  dataKey="Pagas" 
                  fill="#10b981" 
                  name="Vendas Pagas"
                  radius={[4, 4, 0, 0]}
                  barSize={50}
                />
                <Bar 
                  dataKey="Pendentes" 
                  fill="#f59e0b" 
                  name="A Receber (Fiado)"
                  radius={[4, 4, 0, 0]}
                  barSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
              <TrendingUp className="w-16 h-16 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Aguardando Lançamentos</p>
                <p className="text-xs">As barras de vendas aparecerão aqui automaticamente.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


'use client';

import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

      // Regra: é pago se status for 'paid' ou se o método de pagamento não for fiado
      const isPaid = t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado');
      
      if (isPaid) {
        paidTotal += amount;
      } else {
        // Se for pendente, o que foi pago de entrada conta como pago, o resto como pendente
        paidTotal += downPayment;
        pendingTotal += (amount - downPayment);
      }
    });

    // Se não houver nada para mostrar, retorna lista vazia para exibir o placeholder
    if (paidTotal <= 0 && pendingTotal <= 0) return [];

    // Estrutura EXATA sugerida: um único objeto no array com as barras desejadas
    return [
      {
        name: 'Vendas do Mês',
        Pagas: Number(paidTotal.toFixed(2)),
        Pendentes: Number(pendingTotal.toFixed(2)),
      }
    ];
  }, [transactions]);

  // Evita erros de hidratação no Next.js
  if (!isMounted) return <div className="h-[300px] w-full bg-muted/10 animate-pulse rounded-lg" />;

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Resumo Financeiro de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full pt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar 
                  dataKey="Pagas" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  barSize={60} 
                  name="Receitas Pagas"
                />
                <Bar 
                  dataKey="Pendentes" 
                  fill="#f59e0b" 
                  radius={[6, 6, 0, 0]} 
                  barSize={60} 
                  name="Valores a Receber"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
              <TrendingUp className="w-16 h-16 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground">Nenhuma venda encontrada para este período</p>
                <p className="text-xs">As barras aparecerão aqui assim que houver registros.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

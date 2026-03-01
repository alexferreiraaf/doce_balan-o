'use client';

import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

    if (!transactions || transactions.length === 0) return [];

    transactions.forEach((t) => {
      // Garantir que estamos olhando apenas para ENTRADAS (Vendas)
      const type = (t.type || '').toString().toLowerCase();
      if (type !== 'income') return;

      // Conversão ultra-segura de valores
      const amount = parseToNumber(t.amount || 0);
      const downPayment = parseToNumber(t.downPayment || 0);

      // Regra de Negócio: Identificar se foi pago ou é fiado
      const method = (t.paymentMethod || '').toString().toLowerCase();
      const status = (t.status || '').toString().toLowerCase();
      
      const isPaid = status === 'paid' || (status !== 'pending' && method !== 'fiado');
      
      if (isPaid) {
        paidTotal += amount;
      } else {
        // No fiado, o valor da entrada (downPayment) já é dinheiro no bolso (pago)
        // O restante (total - entrada) é o que falta receber (pendente)
        paidTotal += downPayment;
        pendingTotal += (amount - downPayment);
      }
    });

    // Se após somar tudo o resultado for zero, mostramos o placeholder
    if (paidTotal <= 0 && pendingTotal <= 0) return [];

    // Estrutura de dados simplificada conforme sugestão do usuário (Lógica Gemini)
    return [
      {
        name: 'Total de Vendas',
        Recebido: Number(paidTotal.toFixed(2)),
        Fiado: Number(pendingTotal.toFixed(2)),
      }
    ];
  }, [transactions]);

  // Evita erros de hidratação e garante que o gráfico tenha espaço para nascer
  if (!isMounted) return <div className="h-[300px] w-full bg-muted/5 animate-pulse rounded-lg" />;

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="pb-2 bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <BarChart3 className="w-5 h-5" />
          Resumo Financeiro de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px] w-full min-h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  width={80} 
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" verticalAlign="top" align="right" height={36}/>
                <Bar 
                  dataKey="Recebido" 
                  fill="#10b981" 
                  name="Vendas Pagas"
                  radius={[4, 4, 0, 0]}
                  barSize={60}
                  isAnimationActive={false} 
                />
                <Bar 
                  dataKey="Fiado" 
                  fill="#f59e0b" 
                  name="A Receber (Fiado)"
                  radius={[4, 4, 0, 0]}
                  barSize={60}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
              <TrendingUp className="w-16 h-16 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Aguardando Vendas</p>
                <p className="text-xs">As barras aparecerão aqui assim que houver registros.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

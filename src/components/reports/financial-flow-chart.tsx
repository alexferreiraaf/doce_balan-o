'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';

interface FinancialFlowChartProps {
  transactions: Transaction[];
}

export function FinancialFlowChart({ transactions }: FinancialFlowChartProps) {
    const financialFlowData = useMemo(() => {
        const income = transactions
            .filter(t => t.type === 'income' && (t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado')))
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        
        return [
            { name: 'Balanço', Entradas: income, Saídas: expense }
        ];
    }, [transactions]);

    const hasData = financialFlowData[0].Entradas > 0 || financialFlowData[0].Saídas > 0;

    const placeholderData = [
      { name: 'Balanço', Entradas: 100, Saídas: 100 }
    ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balanço Geral (Entradas vs Saídas)</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={financialFlowData}
                margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Entradas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="relative flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-background/80 backdrop-blur-sm p-3 rounded-lg">
                    <p className="font-semibold text-foreground">Aguardando dados...</p>
                    <p className="text-sm">O gráfico aparecerá aqui.</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={placeholderData} margin={{ top: 5, right: 30, left: 20, bottom: 5, }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(value) => ''}/>
                        <Bar dataKey="Entradas" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Saídas" fill="hsl(var(--muted-foreground) / 0.2)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

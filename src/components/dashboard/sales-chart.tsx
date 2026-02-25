'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/app/lib/types';

interface SalesChartProps {
  transactions: Transaction[];
}

// Map data names to specific colors for consistency
const COLOR_MAP: Record<string, string> = {
  'Receitas Pagas': 'hsl(var(--chart-1))', // Primary Pink
  'A Receber': 'hsl(var(--chart-3))',      // Lighter Pink
  'Despesas': 'hsl(var(--chart-4))',     // Red
};


export function SalesChart({ transactions }: SalesChartProps) {
  const chartData = useMemo(() => {
    const incomePaid = transactions
      .filter(t => t.type === 'income' && (t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado')))
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const incomePending = transactions
      .filter(t => t.type === 'income' && (t.status === 'pending' || (!t.status && t.paymentMethod === 'fiado')))
      .reduce((acc, t) => acc + (t.amount || 0), 0);
      
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    
    const data = [];
    if (incomePaid > 0) data.push({ name: 'Receitas Pagas', value: incomePaid });
    if (incomePending > 0) data.push({ name: 'A Receber', value: incomePending });
    if (expense > 0) data.push({ name: 'Despesas', value: expense });

    return data;
  }, [transactions]);
  
  const placeholderData = [
    { name: 'Receitas', value: 70 },
    { name: 'Despesas', value: 30 },
  ];
  const PLACEHOLDER_COLORS = ['hsl(var(--muted-foreground) / 0.3)', 'hsl(var(--muted-foreground) / 0.1)'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balanço Geral</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={80}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={4}
                  paddingAngle={5}
                  cornerRadius={8}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLOR_MAP[entry.name]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{
                    paddingTop: "20px",
                    lineHeight: "24px",
                  }}
                  iconSize={10}
                />
              </PieChart>
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
                  <PieChart>
                    <Pie
                      data={placeholderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      innerRadius={80}
                      outerRadius={110}
                      dataKey="value"
                      stroke="hsl(var(--background))"
                      strokeWidth={4}
                      paddingAngle={5}
                      cornerRadius={8}
                    >
                      {placeholderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

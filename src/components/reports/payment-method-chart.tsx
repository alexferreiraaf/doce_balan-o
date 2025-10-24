'use client';
import { useMemo } from 'react';
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Transaction, PaymentMethod } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';

const COLORS = {
  pix: 'hsl(var(--chart-1))',
  dinheiro: 'hsl(var(--chart-2))',
  cartao: 'hsl(var(--chart-3))',
  fiado: 'hsl(var(--chart-4))',
};

const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    cartao: 'Cartão',
    fiado: 'Fiado',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-sm p-2 border rounded-lg shadow-lg">
        <p className="font-semibold">{`${payload[0].name}`}</p>
        <p className="text-primary">{`${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }

  return null;
};

interface PaymentMethodChartProps {
  transactions: Transaction[];
}

export function PaymentMethodChart({ transactions }: PaymentMethodChartProps) {
  const data = useMemo(() => {
    const incomeByPaymentMethod = transactions
      .filter((t) => t.type === 'income' && t.paymentMethod)
      .reduce((acc, t) => {
        const method = t.paymentMethod!;
        if (!acc[method]) {
          acc[method] = 0;
        }
        acc[method] += t.amount;
        return acc;
      }, {} as { [key in PaymentMethod]?: number });

    return (Object.keys(incomeByPaymentMethod) as PaymentMethod[])
      .map((method) => ({ 
          name: PAYMENT_METHOD_NAMES[method], 
          value: incomeByPaymentMethod[method] || 0,
          method,
        }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 md:h-80 text-muted-foreground">
        <p>Sem dados de receitas para exibir.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.method}`} fill={COLORS[entry.method]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{fontSize: "0.8rem"}} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

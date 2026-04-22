'use client';

import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface ReportCardProps {
  title: string;
  summary: { income: number; expense: number; cost: number; grossProfit: number; balance: number };
}

export const ReportCard = ({ title, summary }: ReportCardProps) => (
  <Card className="border-t-4 border-primary">
    <CardHeader className="p-4">
      <CardTitle className="text-base font-semibold text-primary">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-1 p-4 pt-0">
      <p className="text-sm text-muted-foreground flex justify-between">
        Faturamento: <span className="font-bold text-blue-600">{formatCurrency(summary.income)}</span>
      </p>
      <p className="text-sm text-muted-foreground flex justify-between">
        Custo (CMV): <span className="font-bold text-orange-600">{formatCurrency(summary.cost)}</span>
      </p>
      <p className="text-sm text-muted-foreground flex justify-between">
        Lucro Bruto: <span className="font-bold text-emerald-600">{formatCurrency(summary.grossProfit)}</span>
      </p>
      <p className="text-sm text-muted-foreground flex justify-between">
        Despesas: <span className="font-bold text-red-600">{formatCurrency(summary.expense)}</span>
      </p>
      <p className={`text-md font-bold pt-2 border-t mt-2 flex justify-between ${summary.balance >= 0 ? 'text-foreground' : 'text-red-700'}`}>
        Lucro Líquido: <span>{formatCurrency(summary.balance)}</span>
      </p>
    </CardContent>
  </Card>
);

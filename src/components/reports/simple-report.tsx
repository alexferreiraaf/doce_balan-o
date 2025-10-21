'use client';

import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface ReportCardProps {
  title: string;
  summary: { income: number; expense: number; balance: number };
}

export const ReportCard = ({ title, summary }: ReportCardProps) => (
  <Card className="border-t-4 border-primary">
    <CardHeader className="p-4">
      <CardTitle className="text-base font-semibold text-primary">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-1 p-4 pt-0">
      <p className="text-sm text-muted-foreground flex justify-between">
        Receitas: <span className="font-bold text-green-600">{formatCurrency(summary.income)}</span>
      </p>
      <p className="text-sm text-muted-foreground flex justify-between">
        Despesas: <span className="font-bold text-red-600">{formatCurrency(summary.expense)}</span>
      </p>
      <p className={`text-md font-bold pt-2 border-t mt-2 flex justify-between ${summary.balance >= 0 ? 'text-foreground' : 'text-red-700'}`}>
        Balanço: <span>{formatCurrency(summary.balance)}</span>
      </p>
    </CardContent>
  </Card>
);

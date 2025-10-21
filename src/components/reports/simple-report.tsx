'use client';

import { useMemo, useCallback } from 'react';
import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface ReportCardProps {
  title: string;
  summary: { income: number; expense: number; balance: number };
}

const ReportCard = ({ title, summary }: ReportCardProps) => (
  <Card className="border-t-4 border-primary">
    <CardHeader>
      <CardTitle className="text-lg font-semibold text-primary">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <p className="text-sm text-muted-foreground flex justify-between">
        Receitas: <span className="font-bold text-green-600">{formatCurrency(summary.income)}</span>
      </p>
      <p className="text-sm text-muted-foreground flex justify-between">
        Despesas: <span className="font-bold text-red-600">{formatCurrency(summary.expense)}</span>
      </p>
      <p className={`text-lg font-bold pt-2 border-t mt-2 flex justify-between ${summary.balance >= 0 ? 'text-foreground' : 'text-red-700'}`}>
        Balanço: <span>{formatCurrency(summary.balance)}</span>
      </p>
    </CardContent>
  </Card>
);

interface SimpleReportProps {
  transactions: Transaction[];
}

export function SimpleReport({ transactions }: SimpleReportProps) {
  const calculateSummary = useCallback((startDateMs: number) => {
    const filtered = transactions.filter((t) => t.dateMs >= startDateMs);
    const income = filtered.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const summaries = useMemo(() => {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).getTime();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).getTime();
    return {
      weekly: calculateSummary(oneWeekAgo),
      monthly: calculateSummary(oneMonthAgo),
      annual: calculateSummary(oneYearAgo),
    };
  }, [calculateSummary]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard title="Últimos 7 Dias (Semanal)" summary={summaries.weekly} />
        <ReportCard title="Últimos 30 Dias (Mensal)" summary={summaries.monthly} />
        <ReportCard title="Últimos 365 Dias (Anual)" summary={summaries.annual} />
      </div>
    </div>
  );
}

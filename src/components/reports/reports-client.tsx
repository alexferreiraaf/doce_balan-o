'use client';
import { useTransactions } from '@/app/lib/hooks/use-transactions';
import Loading from '@/app/(main)/loading';
import { ReportCard } from './simple-report';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useCallback } from 'react';
import { SummaryReport } from './summary-report';

export function ReportsClient() {
  const { transactions, loading } = useTransactions();

  const calculateSummary = useCallback((startDateMs: number) => {
    const filtered = transactions.filter((t) => {
        const transactionDateMs = t.dateMs;
        if (!transactionDateMs || typeof transactionDateMs !== 'number') return false;
        return transactionDateMs >= startDateMs;
    });

    const income = filtered
      .filter((t) => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filtered
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return { income, expense, balance: income - expense };
  }, [transactions]);


  const summaries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneWeekAgoMs = oneWeekAgo.getTime();

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    const oneMonthAgoMs = oneMonthAgo.getTime();

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const oneYearAgoMs = oneYearAgo.getTime();

    return {
      weekly: calculateSummary(oneWeekAgoMs),
      monthly: calculateSummary(oneMonthAgoMs),
      annual: calculateSummary(oneYearAgoMs),
    };
  }, [calculateSummary]);


  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
       <h1 className="text-3xl font-bold tracking-tight text-primary">Relatórios de Desempenho</h1>
      
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="annual">Anual</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly">
          <ReportCard title="Balanço dos Últimos 7 Dias" summary={summaries.weekly} />
        </TabsContent>
        <TabsContent value="monthly">
          <ReportCard title="Balanço dos Últimos 30 Dias" summary={summaries.monthly} />
        </TabsContent>
        <TabsContent value="annual">
          <ReportCard title="Balanço do Último Ano" summary={summaries.annual} />
        </TabsContent>
      </Tabs>
      
      <SummaryReport transactions={transactions} />

    </div>
  );
}

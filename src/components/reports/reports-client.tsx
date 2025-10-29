'use client';
import { useTransactions } from '@/app/lib/hooks/use-transactions';
import Loading from '@/app/(main)/loading';
import { ReportCard } from './simple-report';
import { CategoryChart } from './category-chart';
import { IncomeExpenseChart } from './income-expense-chart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useCallback } from 'react';
import { PaymentMethodChart } from './payment-method-chart';

export function ReportsClient() {
  const { transactions, loading } = useTransactions();

  const calculateSummary = useCallback((startDateMs: number) => {
    const filtered = transactions.filter((t) => {
        // Fallback to timestamp if dateMs is missing for older data
        const transactionDateMs = t.dateMs || (t.timestamp?.toMillis() ?? 0);
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
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).getTime();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).getTime();
    return {
      weekly: calculateSummary(oneWeekAgo),
      monthly: calculateSummary(oneMonthAgo),
      annual: calculateSummary(oneYearAgo),
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart transactions={transactions} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Método de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodChart transactions={transactions} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receitas vs Despesas (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart transactions={transactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';
import { useTransactions } from '@/app/lib/hooks/use-transactions';
import Loading from '@/app/(main)/loading';
import { SimpleReport } from './simple-report';
import { CategoryChart } from './category-chart';
import { IncomeExpenseChart } from './income-expense-chart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function ReportsClient() {
  const { transactions, loading } = useTransactions();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
       <h1 className="text-3xl font-bold tracking-tight text-primary">Relatórios de Desempenho</h1>
      <SimpleReport transactions={transactions} />

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

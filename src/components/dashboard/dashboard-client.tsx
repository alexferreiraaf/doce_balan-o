'use client';
import { useMemo } from 'react';
import { Clipboard, TrendingUp } from 'lucide-react';

import { useTransactions } from '@/app/lib/hooks/use-transactions';
import { StatCard } from './stat-card';
import { TransactionList } from './transaction-list';
import { SimpleReport } from '../reports/simple-report';
import Loading from '@/app/(main)/loading';
import { useAuth } from '@/app/lib/hooks/use-auth';

export function DashboardClient() {
  const { transactions, loading } = useTransactions();
  const { userId } = useAuth();

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [transactions]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Balanço Total"
          value={balance}
          colorClass={balance >= 0 ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}
          icon={Clipboard}
        />
        <StatCard
          title="Entradas (Receitas)"
          value={totalIncome}
          colorClass="border-green-400 text-gray-700"
          icon={TrendingUp}
        />
        <StatCard
          title="Saídas (Gastos)"
          value={totalExpense}
          colorClass="border-red-400 text-gray-700"
          icon={Clipboard}
        />
      </div>

      <SimpleReport transactions={transactions} />

      <TransactionList transactions={transactions} />
      
      {userId && (
        <p className="text-xs text-center text-muted-foreground pt-4">
          ID da Confeiteira (Para Debug): {userId}
        </p>
      )}
    </div>
  );
}

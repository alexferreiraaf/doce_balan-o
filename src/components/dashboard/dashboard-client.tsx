'use client';
import { useMemo } from 'react';
import { Wallet, TrendingUp, Clipboard, List } from 'lucide-react';
import Link from 'next/link';

import { useTransactions } from '@/app/lib/hooks/use-transactions';
import { StatCard } from './stat-card';
import Loading from '@/app/(main)/loading';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { DangerZone } from './danger-zone';
import { RecentTransactionsList } from './recent-transactions-list';

export function DashboardClient() {
  const { transactions, loading } = useTransactions();
  const { user } = useUser();

  const { totalIncome, totalExpense, balance, pendingFiadoValue } = useMemo(() => {
    const incomePaid = transactions
      .filter((t) => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const fiado = transactions.filter((t) => t.status === 'pending');
    const fiadoValue = fiado.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome: incomePaid,
      totalExpense: expense,
      balance: incomePaid - expense,
      totalFiadoValue: fiadoValue
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
      return transactions.slice(0, 5);
  }, [transactions]);


  if (loading) {
    return <Loading />;
  }

  return (
    <>
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Balanço (Pago)"
          value={balance}
          colorClass={balance >= 0 ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}
          icon={Wallet}
        />
        <StatCard
          title="Entradas (Pagas)"
          value={totalIncome}
          colorClass="border-blue-400 text-gray-700"
          icon={TrendingUp}
        />
        <StatCard
          title="Saídas (Gastos)"
          value={totalExpense}
          colorClass="border-red-400 text-gray-700"
          icon={Clipboard}
        />
      </div>

       <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
              <List className="w-5 h-5 mr-2" />
              Lançamentos Recentes
            </CardTitle>
            <Button asChild variant="link">
              <Link href="/transactions">Ver Todos</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <RecentTransactionsList transactions={recentTransactions} />
        </CardContent>
      </Card>


      <DangerZone transactions={transactions} />
      
      {user && (
        <p className="text-xs text-center text-muted-foreground pt-4">
          ID da Confeiteira (Para Debug): {user.uid}
        </p>
      )}
    </div>
    </>
  );
}

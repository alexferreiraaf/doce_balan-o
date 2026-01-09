'use client';
import { useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, List, Info } from 'lucide-react';
import Link from 'next/link';

import { useTransactions } from '@/app/lib/hooks/use-transactions';
import { StatCard } from './stat-card';
import Loading from '@/app/(admin)/loading-component';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { DangerZone } from './danger-zone';
import { RecentTransactionsList } from './recent-transactions-list';
import { InputWithCopy } from '../ui/input';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { storefrontUserId } from '@/firebase/config';

export function DashboardClient() {
  const { transactions, loading } = useTransactions();
  const { user } = useUser();

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const incomePaid = transactions
      .filter((t) => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return {
      totalIncome: incomePaid,
      totalExpense: expense,
      balance: incomePaid - expense,
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
      return transactions.slice(0, 5);
  }, [transactions]);


  if (loading) {
    return <Loading />;
  }

  const showStorefrontIdAlert = user?.uid && !storefrontUserId;

  return (
    <>
     <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                icon={TrendingDown}
                />
            </div>
            
            {showStorefrontIdAlert && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Conecte sua loja ao seu painel!</AlertTitle>
                <AlertDescription>
                  Para que os pedidos da sua loja apareçam aqui, você precisa configurar seu ID de vendedor.
                  Copie o ID abaixo e cole no arquivo chamado `.env` na raiz do seu projeto.
                  <div className="mt-3">
                    <InputWithCopy value={`NEXT_PUBLIC_STOREFRONT_USER_ID=${user.uid}`} readOnly/>
                  </div>
                </AlertDescription>
              </Alert>
            )}

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
            
        </div>
    </div>
    </>
  );
}

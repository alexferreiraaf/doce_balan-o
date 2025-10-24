'use client';
import { useMemo } from 'react';
import { Wallet, TrendingUp, Clipboard, CheckCircle, Clock } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

import { useTransactions } from '@/app/lib/hooks/use-transactions';
import { StatCard } from './stat-card';
import { TransactionList } from './transaction-list';
import Loading from '@/app/(main)/loading';
import { useAuth, useFirestore } from '@/firebase';
import { APP_ID } from '@/app/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export function DashboardClient() {
  const { transactions, loading } = useTransactions();
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const { totalIncome, totalExpense, balance, pendingFiado, totalFiadoValue } = useMemo(() => {
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
      pendingFiado: fiado,
      totalFiadoValue: fiadoValue
    };
  }, [transactions]);

  const handleMarkAsPaid = async (transactionId: string) => {
    if (!user || !firestore) return;

    const transactionRef = doc(firestore, `artifacts/${APP_ID}/users/${user.uid}/transactions/${transactionId}`);
    try {
      await updateDoc(transactionRef, { status: 'paid' });
      toast({ title: "Sucesso!", description: "Venda marcada como paga." });
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: transactionRef.path,
            operation: 'update',
            requestResourceData: { status: 'paid' },
        }));
      console.error("Error updating transaction: ", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar a venda." });
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-24 sm:pb-8">
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

      <TransactionList transactions={transactions.filter(t => t.status !== 'pending')} />

      {pendingFiado.length > 0 && (
         <Card className="mt-8">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-amber-600" />
                            Vendas a Prazo (Pendentes)
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Total pendente: <span className="font-bold">{formatCurrency(totalFiadoValue)}</span></p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                {pendingFiado.map((t) => (
                    <li
                    key={t.id}
                    className="flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-lg bg-amber-100/60"
                    >
                    <div className="flex flex-col gap-1 mb-2 sm:mb-0">
                        <span className="font-semibold text-card-foreground">{t.description}</span>
                        <div className='flex items-center gap-2'>
                            <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                            <span className="text-sm font-bold text-amber-700">
                                {formatCurrency(t.amount)}
                            </span>
                        </div>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={() => handleMarkAsPaid(t.id)}
                        className="bg-green-500 hover:bg-green-600 text-white self-end sm:self-center"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como Pago
                    </Button>
                    </li>
                ))}
                </ul>
            </CardContent>
         </Card>
      )}
      
      {user && (
        <p className="text-xs text-center text-muted-foreground pt-4">
          ID da Confeiteira (Para Debug): {user.uid}
        </p>
      )}
    </div>
  );
}

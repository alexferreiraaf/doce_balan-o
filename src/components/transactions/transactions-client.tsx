'use client';
import { useMemo } from 'react';
import { Clock, CheckCircle, User } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

import { useTransactions } from '@/app/lib/hooks/use-transactions';
import Loading from '@/app/(main)/loading';
import { useUser, useFirestore } from '@/firebase';
import { APP_ID } from '@/app/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Badge } from '../ui/badge';
import type { PaymentMethod } from '@/app/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteTransactionButton } from '../dashboard/delete-transaction-button';
import { TransactionList } from './transaction-list';
import { useCustomers } from '@/app/lib/hooks/use-customers';

export function TransactionsClient() {
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { customers, loading: customersLoading } = useCustomers();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const loading = transactionsLoading || customersLoading;

  const { paidTransactions, pendingFiado, totalFiadoValue } = useMemo(() => {
    const paid = transactions.filter(t => t.status !== 'pending');
    const fiado = transactions.filter((t) => t.status === 'pending');
    const fiadoValue = fiado.reduce((sum, t) => sum + t.amount, 0);

    return {
      paidTransactions: paid,
      pendingFiado: fiado,
      totalFiadoValue: fiadoValue
    };
  }, [transactions]);

  const handleMarkAsPaid = (transactionId: string, paymentMethod: PaymentMethod) => {
    if (isUserLoading || !user || !firestore) {
        toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado." });
        return;
    }

    const transactionRef = doc(firestore, `artifacts/${APP_ID}/users/${user.uid}/transactions/${transactionId}`);
    const updateData = { status: 'paid', paymentMethod: paymentMethod };
    
    updateDoc(transactionRef, updateData)
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: transactionRef.path,
            operation: 'update',
            requestResourceData: updateData,
        }));
        console.error("Error updating transaction: ", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar a venda." });
      });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
       <h1 className="text-3xl font-bold tracking-tight text-primary">Meus Lançamentos</h1>
      
      {pendingFiado.length > 0 && (
         <Card>
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
                {pendingFiado.map((t) => {
                    const customerName = customers.find(c => c.id === t.customerId)?.name;
                    return (
                    <li
                      key={t.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center p-3 rounded-lg bg-amber-100/60 gap-2"
                    >
                    <div className="flex-grow flex flex-col gap-1 w-full">
                        <span className="font-semibold text-card-foreground">{t.description}</span>
                        <div className='flex items-center gap-2 flex-wrap'>
                            <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                            {customerName && (
                                <Badge variant="outline" className="text-xs border-primary/50">
                                    <User className="w-3 h-3 mr-1" />
                                    {customerName}
                                </Badge>
                            )}
                             <span className="text-sm font-bold text-amber-700">
                                {formatCurrency(t.amount)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="sm" 
                                    className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                                    disabled={isUserLoading}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Marcar como Pago
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(t.id, 'pix')}>PIX</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(t.id, 'dinheiro')}>Dinheiro</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(t.id, 'cartao')}>Cartão</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DeleteTransactionButton transactionId={t.id} />
                    </div>
                    </li>
                )})}
                </ul>
            </CardContent>
         </Card>
      )}

      <TransactionList 
        transactions={paidTransactions}
        title="Lançamentos Concluídos"
       />
    </div>
  );
}

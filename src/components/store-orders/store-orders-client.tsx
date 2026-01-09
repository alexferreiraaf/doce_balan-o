'use client';
import { useMemo } from 'react';
import { Clock, CheckCircle, User, Banknote, Landmark, FileText, CreditCard, Coins, Eye } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

import { useTransactions } from '@/app/lib/hooks/use-transactions';
import Loading from '@/app/(admin)/loading-component';
import { useUser, useFirestore } from '@/firebase';
import { APP_ID } from '@/app/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Badge } from '../ui/badge';
import type { PaymentMethod, Transaction } from '@/app/lib/types';
import { DeleteTransactionButton } from '../dashboard/delete-transaction-button';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { EditTransactionSheet } from '../transactions/edit-transaction-sheet';
import Link from 'next/link';
import { OrderDetailsDialog } from './order-details-dialog';


const paymentMethodDetails: Record<PaymentMethod, { text: string; icon: React.ElementType }> = {
    pix: { text: 'PIX', icon: Landmark },
    dinheiro: { text: 'Dinheiro', icon: Coins },
    cartao: { text: 'Cartão', icon: CreditCard },
    fiado: { text: 'Fiado', icon: User },
};

interface StoreOrdersClientProps {
  userIds: string[];
}

export function StoreOrdersClient({ userIds }: StoreOrdersClientProps) {
  // The useTransactions hook now handles fetching from multiple userIds.
  const { transactions: allTransactions, loading: transactionsLoading } = useTransactions({ userIds });
  const { customers, loading: customersLoading } = useCustomers();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const loading = transactionsLoading || customersLoading || isUserLoading;

  const { storeOrdersPending, storeOrdersPaid, totalPendingValue } = useMemo(() => {
    // Filter for storefront orders from all fetched transactions.
    const storeOrders = allTransactions.filter(t => t.category === 'Venda Online' || t.fromStorefront);
    
    const pending = storeOrders.filter(t => t.status === 'pending');
    const paid = storeOrders.filter(t => t.status === 'paid');

    const pendingValue = pending.reduce((sum, t) => {
        const remainingAmount = t.amount - (t.downPayment || 0);
        return sum + remainingAmount;
    }, 0);

    return {
      storeOrdersPending: pending,
      storeOrdersPaid: paid,
      totalPendingValue: pendingValue,
    };
  }, [allTransactions]);

  const handleMarkAsPaid = (transaction: Transaction) => {
    if (isUserLoading || !firestore) {
        toast({ variant: "destructive", title: "Erro", description: "Usuário ou serviço indisponível." });
        return;
    }
    // The transaction could belong to a different user (the storefront user)
    const transactionUserId = transaction.userId;
    const transactionRef = doc(firestore, `artifacts/${APP_ID}/users/${transactionUserId}/transactions/${transaction.id}`);
    const updateData = { status: 'paid' };
    
    updateDoc(transactionRef, updateData)
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: transactionRef.path,
            operation: 'update',
            requestResourceData: updateData,
        }));
        console.error("Error updating transaction: ", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar o pedido." });
      });
  };

  if (loading) {
    return <Loading />;
  }
  
  const TransactionRow = ({ t }: { t: Transaction }) => {
    const customer = customers.find(c => c.id === t.customerId);
    const paymentInfo = t.paymentMethod ? paymentMethodDetails[t.paymentMethod] : null;
    return (
       <li
        key={t.id}
        className="flex flex-col sm:flex-row items-start sm:items-center p-3 rounded-lg bg-amber-100/60 gap-2"
      >
      <div className="flex-grow flex flex-col gap-2 w-full">
          <span className="font-semibold text-card-foreground">{t.description}</span>
          <div className='flex items-center gap-2 flex-wrap'>
              {customer && (
                  <Badge variant="outline" className="text-xs border-primary/50">
                      <User className="w-3 h-3 mr-1" />
                      {customer.name}
                  </Badge>
              )}
              {paymentInfo && (
                <Badge variant="outline" className="text-xs">
                  <paymentInfo.icon className="w-3 h-3 mr-1" />
                  {paymentInfo.text}
                </Badge>
              )}
              <Badge variant="destructive" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Pendente: {formatCurrency(t.amount)}
              </Badge>
          </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
                size="sm" 
                className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                disabled={isUserLoading}
                onClick={() => handleMarkAsPaid(t)}
            >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar como Pago
            </Button>
          {customer && (
            <OrderDetailsDialog transaction={t} customer={customer} />
          )}
          <EditTransactionSheet transaction={t} />
          <DeleteTransactionButton transactionId={t.id} transactionUserId={t.userId} />
      </div>
      </li>
    )
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Pedidos da Loja
            </h1>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-amber-600" />
                  Pedidos Pendentes
                </CardTitle>
                <p className="text-sm text-muted-foreground">Total pendente: <span className="font-bold">{formatCurrency(totalPendingValue)}</span></p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {storeOrdersPending.length > 0 ? (
              <ul className="space-y-3">
                {storeOrdersPending.map((t) => <TransactionRow key={t.id} t={t} />)}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido pendente no momento.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Pedidos Concluídos
            </CardTitle>
          </CardHeader>
           <CardContent>
              {storeOrdersPaid.length > 0 ? (
                <ul className="space-y-3">
                  {storeOrdersPaid.map((t) => {
                    const customerName = customers.find(c => c.id === t.customerId)?.name;
                    return (
                       <li key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center p-3 rounded-lg bg-green-100/50 gap-2">
                        <div className="flex-grow flex flex-col gap-1 w-full">
                            <span className="font-semibold text-card-foreground">{t.description}</span>
                             {customerName && (
                              <Badge variant="outline" className="text-xs border-primary/50 w-fit">
                                  <User className="w-3 h-3 mr-1" />
                                  {customerName}
                              </Badge>
                            )}
                        </div>
                         <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <span className="font-bold text-lg text-green-600">
                              {formatCurrency(t.amount)}
                            </span>
                            <DeleteTransactionButton transactionId={t.id} transactionUserId={t.userId} />
                         </div>
                       </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido concluído ainda.</p>
              )}
           </CardContent>
        </Card>
      </div>
    </>
  );
}

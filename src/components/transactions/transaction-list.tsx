'use client';

import { ClipboardIcon, CreditCard, Landmark, Coins, Receipt, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction, PaymentMethod, Customer } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { DeleteTransactionButton } from '../dashboard/delete-transaction-button';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { EditTransactionSheet } from './edit-transaction-sheet';

interface TransactionListProps {
  transactions: Transaction[];
  title: string;
}

const paymentMethodDetails: Record<PaymentMethod, { text: string; icon: React.ElementType }> = {
    pix: { text: 'PIX', icon: Landmark },
    dinheiro: { text: 'Dinheiro', icon: Coins },
    cartao: { text: 'Cartão', icon: CreditCard },
    fiado: { text: 'Fiado', icon: Receipt },
};

export function TransactionList({ transactions, title }: TransactionListProps) {
  const { customers } = useCustomers();

  if (transactions.length === 0) {
    return (
        <div className="text-center p-8 text-muted-foreground border rounded-lg mt-8">
          <ClipboardIcon className="w-10 h-10 mx-auto text-primary/50 mb-3" />
          <p className="text-lg font-medium">Nenhum lançamento nesta categoria.</p>
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {transactions.map((t) => {
            const paymentInfo = t.paymentMethod ? paymentMethodDetails[t.paymentMethod] : null;
            const customerName = customers.find(c => c.id === t.customerId)?.name;
            return (
                <li
                key={t.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center p-3 rounded-lg transition duration-150 ease-in-out gap-2 ${
                    t.type === 'income' ? 'bg-green-100/50 hover:bg-green-100' : 'bg-red-100/50 hover:bg-red-100'
                }`}
                >
                <div className="flex-grow flex flex-col gap-1 w-full">
                    <span className="font-semibold text-card-foreground">{t.description}</span>
                    <div className='flex items-center gap-2 flex-wrap'>
                        <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                        {t.type === 'income' && paymentInfo && (
                            <Badge variant={t.paymentMethod === 'fiado' ? 'destructive' : 'outline'} className="text-xs">
                                <paymentInfo.icon className="w-3 h-3 mr-1" />
                                {paymentInfo.text}
                            </Badge>
                        )}
                         {customerName && (
                          <Badge variant="outline" className="text-xs border-primary/50">
                              <User className="w-3 h-3 mr-1" />
                              {customerName}
                          </Badge>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                    <span className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'expense' && '- '}
                        {formatCurrency(t.amount)}
                    </span>
                    <EditTransactionSheet transaction={t} />
                    <DeleteTransactionButton transactionId={t.id} />
                </div>
                </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

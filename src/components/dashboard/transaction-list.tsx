'use client';

import { ClipboardIcon, CreditCard, Landmark, Coins, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction, PaymentMethod } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { DeleteTransactionButton } from './delete-transaction-button';
import { Button } from '../ui/button';

interface TransactionListProps {
  transactions: Transaction[];
  totalTransactions: number;
  isShowingAll: boolean;
  onShowAll: () => void;
}

const paymentMethodDetails: Record<PaymentMethod, { text: string; icon: React.ElementType }> = {
    pix: { text: 'PIX', icon: Landmark },
    dinheiro: { text: 'Dinheiro', icon: Coins },
    cartao: { text: 'Cartão', icon: CreditCard },
    fiado: { text: 'Fiado', icon: Receipt },
};

export function TransactionList({ transactions, totalTransactions, isShowingAll, onShowAll }: TransactionListProps) {
  if (totalTransactions === 0) {
    return (
      <Card className="mt-8">
        <CardContent className="text-center p-8 text-muted-foreground">
          <ClipboardIcon className="w-10 h-10 mx-auto text-primary/50 mb-3" />
          <p className="text-lg font-medium">Nenhum lançamento encontrado.</p>
          <p className="text-sm">Comece a registrar suas receitas e despesas!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800">Últimos Lançamentos</CardTitle>
          {!isShowingAll && totalTransactions > 10 && (
             <Button variant="link" onClick={onShowAll}>Ver Todos</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {transactions.map((t) => {
            const paymentInfo = t.paymentMethod ? paymentMethodDetails[t.paymentMethod] : null;
            return (
                <li
                key={t.id}
                className={`flex items-center p-3 rounded-lg transition duration-150 ease-in-out ${
                    t.type === 'income' ? 'bg-green-100/50 hover:bg-green-100' : 'bg-red-100/50 hover:bg-red-100'
                }`}
                >
                <div className="flex-grow flex flex-col gap-1">
                    <span className="font-semibold text-card-foreground">{t.description}</span>
                    <div className='flex items-center gap-2 flex-wrap'>
                        <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                        {t.type === 'income' && paymentInfo && (
                            <Badge variant={t.paymentMethod === 'fiado' ? 'destructive' : 'outline'} className="text-xs">
                                <paymentInfo.icon className="w-3 h-3 mr-1" />
                                {paymentInfo.text}
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'expense' && '- '}
                        {formatCurrency(t.amount)}
                    </span>
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

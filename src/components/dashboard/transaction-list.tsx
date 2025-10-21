'use client';

import { ClipboardIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/app/lib/types';
import { formatCurrency } from '@/lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
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
        <CardTitle className="text-xl font-bold text-gray-800">Últimos Lançamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {transactions.slice(0, 10).map((t) => (
            <li
              key={t.id}
              className={`flex justify-between items-center p-3 rounded-lg transition duration-150 ease-in-out ${
                t.type === 'income' ? 'bg-green-100/50 hover:bg-green-100' : 'bg-red-100/50 hover:bg-red-100'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-card-foreground">{t.description}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{t.category}</span>
              </div>
              <span className={`font-bold text-lg ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {t.type === 'expense' && '- '}
                {formatCurrency(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

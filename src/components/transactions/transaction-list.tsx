'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { ClipboardIcon, CreditCard, Landmark, Coins, Receipt, User, CalendarIcon, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Transaction, PaymentMethod, Customer } from '@/app/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { DeleteTransactionButton } from '../dashboard/delete-transaction-button';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { EditTransactionSheet } from './edit-transaction-sheet';
import { useUser } from '@/firebase';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

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
  const { user } = useUser();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const filteredTransactions = transactions.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false;
    
    let tDate: Date;
    const dateVal = t.timestamp || t.dateMs;
    if (typeof dateVal === 'number') {
      tDate = new Date(dateVal);
    } else if (dateVal && typeof (dateVal as any).toDate === 'function') {
      tDate = (dateVal as any).toDate();
    } else {
      tDate = new Date(dateVal as any);
    }
    tDate.setHours(0, 0, 0, 0);

    if (startDate) {
      const fromDate = new Date(startDate);
      fromDate.setHours(0, 0, 0, 0);
      if (tDate < fromDate) return false;
    }
    
    if (endDate) {
      const toDate = new Date(endDate);
      toDate.setHours(23, 59, 59, 999);
      if (tDate > toDate) return false;
    }
    
    return true;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

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
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold text-gray-800">{title}</CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[150px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : <span>Data Inicial</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={ptBR}
                />
                {startDate && (
                   <div className="p-2">
                       <Button variant="ghost" className="w-full text-destructive" onClick={() => setStartDate(undefined)}>
                          <X className="w-4 h-4 mr-2"/>
                          Limpar
                       </Button>
                   </div>
                )}
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[150px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : <span>Data Final</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={ptBR}
                />
                {endDate && (
                   <div className="p-2">
                       <Button variant="ghost" className="w-full text-destructive" onClick={() => setEndDate(undefined)}>
                          <X className="w-4 h-4 mr-2"/>
                          Limpar
                       </Button>
                   </div>
                )}
              </PopoverContent>
            </Popover>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="income">Entradas</TabsTrigger>
                <TabsTrigger value="expense">Saídas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
            {(filter === 'all' || filter === 'income') && (
              <div>
                 <p className="text-sm text-muted-foreground">Total de Entradas</p>
                 <p className="text-lg font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
            )}
            {(filter === 'all' || filter === 'expense') && (
              <div>
                 <p className="text-sm text-muted-foreground">Total de Saídas</p>
                 <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpense)}</p>
              </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground">
              <p>Nenhum lançamento encontrado para este filtro.</p>
            </div>
        ) : (
          <ul className="space-y-3">
            {filteredTransactions.map((t) => {
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
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {formatDate(t.timestamp || t.dateMs)}
                        </Badge>
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
                    <DeleteTransactionButton transactionId={t.id} transactionUserId={t.userId} />
                </div>
                </li>
            )
          })}
        </ul>
        )}
      </CardContent>
    </Card>
  );
}

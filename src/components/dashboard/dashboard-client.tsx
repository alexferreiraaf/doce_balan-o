'use client';
import { useMemo, useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, List, Info, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { addMonths, subMonths, format } from 'date-fns';

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
import { TopProducts } from './top-products';
import { AddProductDialog } from './add-product-dialog';
import { AddCustomerDialog } from './add-customer-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn, parseToNumber } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { SalesBarChart } from './sales-bar-chart';

export function DashboardClient() {
  const { user } = useUser();
  
  const userIdsToFetch = [user?.uid, storefrontUserId].filter(Boolean) as string[];
  const { transactions, loading } = useTransactions({ userIds: userIdsToFetch });

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDayOfMonth);
    setEndDate(today);
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!startDate || !endDate) {
      return [];
    }
    const fromTime = startDate.getTime();
    const toTime = new Date(endDate).setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      let transactionTime = 0;
      
      if (t.dateMs) {
        transactionTime = parseToNumber(t.dateMs);
      } else if (t.timestamp) {
        if (typeof t.timestamp.toMillis === 'function') {
          transactionTime = t.timestamp.toMillis();
        } else if (t.timestamp.seconds) {
          transactionTime = t.timestamp.seconds * 1000;
        } else if (t.timestamp instanceof Date) {
          transactionTime = t.timestamp.getTime();
        }
      }
      
      if (!transactionTime || isNaN(transactionTime)) return false;
      return transactionTime >= fromTime && transactionTime <= toTime;
    });
  }, [transactions, startDate, endDate]);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const incomePaid = filteredTransactions
      .filter((t) => 
        t.type === 'income' && 
        (t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado'))
      )
      .reduce((sum, t) => sum + parseToNumber(t.amount), 0);

    const downPayments = filteredTransactions
      .filter((t) => 
        t.type === 'income' && 
        (t.status === 'pending' || (!t.status && t.paymentMethod === 'fiado')) &&
        t.downPayment && parseToNumber(t.downPayment) > 0
      )
      .reduce((sum, t) => sum + parseToNumber(t.downPayment), 0);

    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseToNumber(t.amount), 0);
      
    const finalIncome = incomePaid + downPayments;

    return {
      totalIncome: finalIncome,
      totalExpense: expense,
      balance: finalIncome - expense,
    };
  }, [filteredTransactions]);

  const recentTransactions = useMemo(() => {
      return [...filteredTransactions].sort((a, b) => {
          const dateA = parseToNumber(a.dateMs) || (a.timestamp?.seconds ? a.timestamp.seconds * 1000 : 0);
          const dateB = parseToNumber(b.dateMs) || (b.timestamp?.seconds ? b.timestamp.seconds * 1000 : 0);
          return dateB - dateA;
      }).slice(0, 5);
  }, [filteredTransactions]);

  const handleMonthChange = (direction: 'next' | 'prev') => {
    const operation = direction === 'next' ? addMonths : subMonths;
    const currentStartDate = startDate || new Date();
    
    const newStartDate = operation(currentStartDate, 1);
    newStartDate.setDate(1); 
    
    const newEndDate = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0);
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };


  if (loading || !startDate || !endDate) {
    return <Loading />;
  }

  const showStorefrontIdAlert = user?.uid && !storefrontUserId;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 md:space-y-8">
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <AddProductDialog />
                    <AddCustomerDialog />
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end bg-card p-2 rounded-lg border shadow-sm">
              <span className="text-xs font-bold text-muted-foreground uppercase mr-2 hidden sm:inline">Período:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yy") : <span>Início</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yy") : <span>Fim</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-1 ml-2 border-l pl-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMonthChange('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMonthChange('next')}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

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
                colorClass="border-blue-400 text-blue-700"
                icon={TrendingUp}
                />
                <StatCard
                title="Saídas (Gastos)"
                value={totalExpense}
                colorClass="border-red-400 text-red-700"
                icon={TrendingDown}
                />
            </div>

            <div className="w-full">
                <SalesBarChart transactions={filteredTransactions} />
            </div>
            
            {showStorefrontIdAlert && (
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">Conecte sua loja ao seu painel!</AlertTitle>
                <AlertDescription>
                  Para que os pedidos da sua loja apareçam aqui, configure seu ID de vendedor.
                  Copie o ID abaixo e cole no arquivo chamado `.env` na raiz do seu projeto.
                  <div className="mt-3">
                    <InputWithCopy value={`NEXT_PUBLIC_STOREFRONT_USER_ID=${user.uid}`} readOnly/>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TopProducts transactions={filteredTransactions} />
                <Card className="shadow-md">
                    <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                        <List className="w-5 h-5 mr-2 text-primary" />
                        Lançamentos Recentes
                        </CardTitle>
                        <Button asChild variant="link" className="text-primary font-bold">
                        <Link href="/transactions">Ver Todos</Link>
                        </Button>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <RecentTransactionsList transactions={recentTransactions} />
                    </CardContent>
                </Card>
            </div>

            <DangerZone transactions={filteredTransactions} />
            
        </div>
    </div>
  );
}

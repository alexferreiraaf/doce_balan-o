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
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { SalesChart } from './sales-chart';

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
    const toDate = new Date(endDate);
    toDate.setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const transactionDateMs = t.dateMs;
      if (!transactionDateMs || typeof transactionDateMs !== 'number') return false;
      return transactionDateMs >= startDate.getTime() && transactionDateMs <= toDate.getTime();
    });
  }, [transactions, startDate, endDate]);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const incomePaid = filteredTransactions
      .filter((t) => t.type === 'income' && (t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado')))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
    return {
      totalIncome: incomePaid,
      totalExpense: expense,
      balance: incomePaid - expense,
    };
  }, [filteredTransactions]);

  const recentTransactions = useMemo(() => {
      return filteredTransactions.sort((a, b) => b.dateMs - a.dateMs).slice(0, 5);
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
    <>
     <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 md:space-y-8">
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <AddProductDialog />
                    <AddCustomerDialog />
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/y") : <span>Data Inicial</span>}
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
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/y") : <span>Data Final</span>}
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
              <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}>
                  <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}>
                  <ChevronRight className="h-4 w-4" />
              </Button>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesChart transactions={filteredTransactions} />
                <TopProducts transactions={filteredTransactions} />
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


            <DangerZone transactions={filteredTransactions} />
            
        </div>
    </div>
    </>
  );
}

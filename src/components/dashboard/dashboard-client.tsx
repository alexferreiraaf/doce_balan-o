'use client';
import { useMemo, useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { addMonths, subMonths, format, startOfMonth, endOfMonth, isDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useTransactions } from '@/app/lib/hooks/use-transactions';
import { StatCard } from './stat-card';
import Loading from '@/app/(admin)/loading-component';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { DangerZone } from './danger-zone';
import { RecentTransactionsList } from './recent-transactions-list';
import { storefrontUserId } from '@/firebase/config';
import { TopProducts } from './top-products';
import { AddProductDialog } from './add-product-dialog';
import { AddCustomerDialog } from './add-customer-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { SalesBarChart } from './sales-bar-chart';
import { parseToNumber } from '@/lib/utils';

export function DashboardClient() {
  const { user } = useUser();
  const userIdsToFetch = useMemo(() => [user?.uid, storefrontUserId].filter(Boolean) as string[], [user?.uid]);
  const { transactions, loading } = useTransactions({ userIds: userIdsToFetch });

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const today = new Date();
    setStartDate(startOfMonth(today));
    setEndDate(endOfMonth(today));
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!startDate || !endDate || !Array.isArray(transactions)) return [];
    
    const fromTime = startDate.getTime();
    const toTime = endDate.getTime() + 86399999;
    
    return transactions.filter((t) => {
      let transactionTime = 0;
      if (t.dateMs && typeof t.dateMs === 'number') {
        transactionTime = t.dateMs;
      } else if (t.timestamp && typeof t.timestamp.toMillis === 'function') {
        transactionTime = t.timestamp.toMillis();
      } else {
        transactionTime = new Date(t.dateMs || 0).getTime();
      }
      return transactionTime >= fromTime && transactionTime <= toTime;
    });
  }, [transactions, startDate, endDate]);

  const totals = useMemo(() => {
    let paidVal = 0;
    let pendingVal = 0;
    let expenseVal = 0;

    filteredTransactions.forEach(t => {
      const amount = parseToNumber(t.amount);
      const downPayment = parseToNumber(t.downPayment);
      
      if (t.type === 'income') {
        const isPaid = t.status === 'paid' || (t.paymentMethod !== 'fiado' && t.status !== 'pending' && t.paymentMethod !== null);
        if (isPaid) { 
          paidVal += amount; 
        } else { 
          paidVal += downPayment; 
          pendingVal += (amount - downPayment); 
        }
      } else { 
        expenseVal += amount; 
      }
    });

    return { 
      income: paidVal, 
      expense: expenseVal, 
      balance: paidVal - expenseVal, 
      pending: pendingVal 
    };
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    if (!startDate || !isDate(startDate)) return [];
    const monthName = format(startDate, 'MMMM', { locale: ptBR });
    return [
      {
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        Pagas: parseToNumber(totals.income),
        Pendentes: parseToNumber(totals.pending),
      }
    ];
  }, [totals, startDate]);

  const handleMonthChange = (direction: 'next' | 'prev') => {
    const operation = direction === 'next' ? addMonths : subMonths;
    const current = startDate || new Date();
    const next = operation(current, 1);
    setStartDate(startOfMonth(next));
    setEndDate(endOfMonth(next));
  };

  if (loading || !startDate || !endDate) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Painel de Controle</h1>
                <div className="flex items-center gap-2">
                    <AddProductDialog />
                    <AddCustomerDialog />
                </div>
            </div>

            <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm w-fit ml-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[140px] justify-start text-xs font-bold">
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {format(startDate, "MMMM / yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(startOfMonth(d))} />
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-1 ml-2 border-l pl-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMonthChange('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMonthChange('next')}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Balanço (Pago)" value={totals.balance} colorClass={totals.balance >= 0 ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'} icon={Wallet} />
                <StatCard title="Entradas (Pagas)" value={totals.income} colorClass="border-blue-500 text-blue-600" icon={TrendingUp} />
                <StatCard title="Saídas (Gastos)" value={totals.expense} colorClass="border-red-400 text-red-600" icon={TrendingDown} />
            </div>

            <SalesBarChart chartData={chartData} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TopProducts transactions={filteredTransactions} />
                <Card className="shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center">
                          <List className="w-5 h-5 mr-2 text-primary" />
                          Lançamentos Recentes
                        </CardTitle>
                        <Button asChild variant="link" size="sm"><Link href="/transactions">Ver Todos</Link></Button>
                    </CardHeader>
                    <CardContent>
                      <RecentTransactionsList transactions={filteredTransactions.slice(0, 5)} />
                    </CardContent>
                </Card>
            </div>
            <DangerZone transactions={filteredTransactions} />
        </div>
    </div>
  );
}

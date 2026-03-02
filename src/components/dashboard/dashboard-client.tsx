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
import { Calendar } from '../ui/calendar';
import { SalesBarChart } from './sales-bar-chart';
import { parseToNumber } from '@/lib/utils';

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
    if (!startDate || !endDate) return [];
    
    const fromTime = startDate.getTime();
    const toTime = new Date(endDate).setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      let transactionTime = t.dateMs;
      if (!transactionTime && t.timestamp) {
        transactionTime = t.timestamp.toMillis ? t.timestamp.toMillis() : (t.timestamp.seconds * 1000);
      }
      return transactionTime >= fromTime && transactionTime <= toTime;
    });
  }, [transactions, startDate, endDate]);

  // PREPARAÇÃO DOS DADOS (Lógica sugerida para o gráfico aparecer)
  const { totals, chartDataArray } = useMemo(() => {
    let paidVal = 0;
    let pendingVal = 0;
    let expenseVal = 0;

    filteredTransactions.forEach(t => {
      const amount = parseToNumber(t.amount);
      const downPayment = parseToNumber(t.downPayment);

      if (t.type === 'income') {
        const isPaid = t.status === 'paid' || (t.paymentMethod !== 'fiado' && t.status !== 'pending');
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

    // Formata o array exatamente como o Recharts espera
    const dataForChart = (paidVal > 0 || pendingVal > 0) ? [
      {
        name: 'Vendas do Período',
        'Pagas': Number(paidVal.toFixed(2)),
        'Pendentes': Number(pendingVal.toFixed(2)),
      }
    ] : [];

    return {
      totals: {
        income: paidVal,
        expense: expenseVal,
        balance: paidVal - expenseVal
      },
      chartDataArray: dataForChart
    };
  }, [filteredTransactions]);

  const handleMonthChange = (direction: 'next' | 'prev') => {
    const operation = direction === 'next' ? addMonths : subMonths;
    const current = startDate || new Date();
    const next = operation(current, 1);
    next.setDate(1);
    setStartDate(next);
    setEndDate(new Date(next.getFullYear(), next.getMonth() + 1, 0));
  };

  if (loading || !startDate || !endDate) {
    return <Loading />;
  }

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
                  <Button variant="outline" size="sm" className="w-[120px] justify-start text-xs">
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {format(startDate, "dd/MM/yy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">-</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[120px] justify-start text-xs">
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {format(endDate, "dd/MM/yy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} />
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

            <SalesBarChart chartData={chartDataArray} />
            
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

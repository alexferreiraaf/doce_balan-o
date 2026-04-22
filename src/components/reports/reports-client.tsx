'use client';
import { useTransactions } from '@/app/lib/hooks/use-transactions';
import Loading from '@/app/(admin)/loading-component';
import { SummaryReport } from './summary-report';
import { useMemo, useState, useEffect } from 'react';
import { addDays, format, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ReportCard } from './simple-report';
import { storefrontUserId } from '@/firebase/config';
import { useUser } from '@/firebase';

export function ReportsClient() {
  const { user } = useUser();
  const userIdsToFetch = [user?.uid, storefrontUserId].filter(Boolean) as string[];
  const { transactions, loading } = useTransactions({ userIds: userIdsToFetch });
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // Set initial dates on the client side to avoid hydration mismatch
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


  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let cmv = 0;

    filteredTransactions.forEach(t => {
       if (t.type === 'income' && (t.status === 'paid' || (!t.status && t.paymentMethod !== 'fiado'))) {
           income += (t.amount || 0);
           if (t.cartItems) {
               t.cartItems.forEach(item => { cmv += (item.cost || 0) * item.quantity; });
           }
       } else if (t.type === 'expense') {
           expense += (t.amount || 0);
       }
    });
      
    return { income, expense, cost: cmv, grossProfit: income - cmv, balance: income - cmv - expense };
  }, [filteredTransactions]);
  
  const handleMonthChange = (direction: 'next' | 'prev') => {
    const operation = direction === 'next' ? addMonths : subMonths;
    const currentStartDate = startDate || new Date();
    
    const newStartDate = operation(currentStartDate, 1);
    newStartDate.setDate(1); // Garante que começa no dia 1
    
    const newEndDate = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0);
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };


  if (loading || !startDate || !endDate) {
    return <Loading />;
  }
  
  const reportTitle = `Balanço de ${startDate ? format(startDate, "dd/MM/y") : ''}${endDate ? ` a ${format(endDate, "dd/MM/y")}`: ''}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Relatórios de Desempenho</h1>
         <div className="flex items-center gap-2 flex-wrap justify-center">
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
      </div>
      
      <ReportCard title={reportTitle} summary={summary} />
      
      <SummaryReport transactions={filteredTransactions} />

    </div>
  );
}

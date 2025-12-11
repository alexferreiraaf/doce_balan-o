'use client';
import { useTransactions } from '@/app/lib/hooks/use-transactions';
import Loading from '@/app/(main)/loading';
import { SummaryReport } from './summary-report';
import { useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, format, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ReportCard } from './simple-report';
import { IncomeExpenseChart } from './income-expense-chart';
import { CategoryPieChart } from './category-pie-chart';

export function ReportsClient() {
  const { transactions, loading } = useTransactions();
  const [startDate, setStartDate] = useState<Date | undefined>(addDays(new Date(), -30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const dateRange: DateRange | undefined = useMemo(() => ({
    from: startDate,
    to: endDate,
  }), [startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    if (!startDate || !endDate) {
      return [];
    }
    // Set time to end of day for 'to' date to include all transactions on that day
    const toDate = new Date(endDate);
    toDate.setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const transactionDateMs = t.dateMs;
      if (!transactionDateMs || typeof transactionDateMs !== 'number') return false;
      return transactionDateMs >= startDate.getTime() && transactionDateMs <= toDate.getTime();
    });
  }, [transactions, startDate, endDate]);


  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const handleMonthChange = (direction: 'next' | 'prev') => {
    const operation = direction === 'next' ? addMonths : subMonths;
    setStartDate(prev => prev ? operation(prev, 1) : undefined);
    setEndDate(prev => prev ? operation(prev, 1) : undefined);
  };


  if (loading) {
    return <Loading />;
  }
  
  const reportTitle = `Balanço de ${startDate ? format(startDate, "dd/MM/y") : ''}${endDate ? ` a ${format(endDate, "dd/MM/y")}`: ''}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Relatórios de Desempenho</h1>
         <div className="flex items-center gap-2">
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <IncomeExpenseChart transactions={filteredTransactions} />
        <CategoryPieChart transactions={filteredTransactions} />
      </div>

      <SummaryReport transactions={filteredTransactions} />

    </div>
  );
}
